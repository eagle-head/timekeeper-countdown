/* eslint-env node */

import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const rootDir = path.resolve('.')
const outputPath = path.join(rootDir, 'artifacts', 'baseline', 'ast-map.json')
const sourcePrefixes = ['src', path.join('packages', 'core', 'src')]

function loadTsConfig() {
  const candidates = ['tsconfig.json', path.join('packages', 'core', 'tsconfig.json')]
  const configPath = candidates
    .map((candidate) => path.join(rootDir, candidate))
    .find((candidatePath) => ts.sys.fileExists(candidatePath))

  if (!configPath) {
    throw new Error('Cannot find a tsconfig.json for AST map generation')
  }
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
  if (configFile.error) {
    throw new Error('Failed to read tsconfig.json')
  }
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath)
  )
  return parsed
}

function kindName(kind) {
  return ts.SyntaxKind[kind] ?? `Unknown(${kind})`
}

function collectAstInfo(sourceFile) {
  const info = {
    exports: [],
    declarations: [],
    imports: [],
  }

  ts.forEachChild(sourceFile, (node) => {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration: {
        const moduleSpecifier = node.moduleSpecifier
        if (moduleSpecifier && ts.isStringLiteral(moduleSpecifier)) {
          info.imports.push(moduleSpecifier.text)
        }
        break
      }
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.VariableStatement:
      case ts.SyntaxKind.ClassDeclaration:
      case ts.SyntaxKind.InterfaceDeclaration:
      case ts.SyntaxKind.TypeAliasDeclaration: {
        const name = node.name ? node.name.getText(sourceFile) : undefined
        const isExported = node.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
        )
        if (name) {
          info.declarations.push({
            name,
            kind: kindName(node.kind),
            exported: Boolean(isExported),
          })
          if (isExported) {
            info.exports.push(name)
          }
        }
        break
      }
      default:
        break
    }
  })

  info.imports = Array.from(new Set(info.imports)).sort()
  info.declarations = info.declarations.sort((a, b) => a.name.localeCompare(b.name))
  info.exports = Array.from(new Set(info.exports)).sort()
  return info
}

async function main() {
  const parsedConfig = loadTsConfig()
  const program = ts.createProgram({
    rootNames: parsedConfig.fileNames,
    options: parsedConfig.options,
  })
  const astMap = {}
  for (const sourceFile of program.getSourceFiles()) {
    const fileName = sourceFile.fileName
    if (!fileName.startsWith(rootDir)) {
      continue
    }
    const relPath = path.relative(rootDir, fileName)
    if (
      relPath.startsWith('node_modules') ||
      relPath.startsWith('dist') ||
      !sourcePrefixes.some((prefix) => relPath.startsWith(prefix))
    ) {
      continue
    }
    astMap[relPath] = collectAstInfo(sourceFile)
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(astMap, null, 2))
  globalThis.console?.log?.(`AST map written to ${outputPath}`)
}

main().catch((error) => {
  globalThis.console?.error?.(error)
  if (globalThis.process) {
    globalThis.process.exitCode = 1
  }
})
