/* eslint-env node */

import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const rootDir = path.resolve('.')
const outputPath = path.join(rootDir, 'docs', 'internal', 'dependency-graph.json')
const sourcePrefixes = ['src', path.join('packages', 'core', 'src')]

function loadTsConfig() {
  const candidates = ['tsconfig.json', path.join('packages', 'core', 'tsconfig.json')]
  const configPath = candidates
    .map((candidate) => path.join(rootDir, candidate))
    .find((candidatePath) => ts.sys.fileExists(candidatePath))

  if (!configPath) {
    throw new Error('Cannot find a tsconfig.json for graph generation')
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

function buildGraph(program) {
  const graph = {}
  const sourceFiles = program.getSourceFiles()
  for (const sourceFile of sourceFiles) {
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
    const imports = []
    const externals = []
    const resolvedModules = sourceFile.resolvedModules
    if (resolvedModules) {
      resolvedModules.forEach((resolved, specifier) => {
        if (!resolved) return
        if (resolved.isExternalLibraryImport) {
          externals.push(specifier)
        } else {
          const resolvedPath = path.relative(
            rootDir,
            resolved.resolvedFileName ?? ''
          )
          if (!resolvedPath) return
          if (!imports.includes(resolvedPath)) {
            imports.push(resolvedPath)
          }
        }
      })
    }
    graph[relPath] = {
      imports: imports.sort(),
      externals: externals.sort(),
    }
  }
  return graph
}

async function main() {
  const parsedConfig = loadTsConfig()
  const program = ts.createProgram({
    rootNames: parsedConfig.fileNames,
    options: parsedConfig.options,
  })
  const graph = buildGraph(program)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2))
  globalThis.console?.log?.(`Dependency graph written to ${outputPath}`)
}

main().catch((error) => {
  globalThis.console?.error?.(error)
  if (globalThis.process) {
    globalThis.process.exitCode = 1
  }
})
