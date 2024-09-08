# FAQ

This section answers frequently asked questions about the **Timekeeper Countdown** library. If you have further questions, feel free to consult the documentation or raise an issue on the GitHub repository.

### 1. **What is the purpose of the Timekeeper Countdown library?**

The library provides an easy-to-use countdown timer hook for React and React Native projects. It allows you to easily create countdowns with various control options like start, pause, reset, restart, and more.

### 2. **Can I use this library with React Native?**

Yes, the **Timekeeper Countdown** library is compatible with both React and React Native, making it versatile for mobile and web applications.

### 3. **How do I change the initial time after starting the countdown?**

You can change the initial countdown time using the `restart` or `reset` methods, which allow you to restart or reset the countdown with a new value.

### 4. **What happens when the countdown reaches zero?**

When the countdown reaches zero, the internal state switches to `COMPLETED`. You can handle this state by triggering custom events, like showing an alert or performing an action when the countdown completes.

### 5. **How do I format the countdown time in days, hours, minutes, and seconds?**

The `useCountdown` hook provides `days`, `hours`, `minutes`, and `seconds` for convenience, allowing you to format the countdown easily in any unit of time.

### 6. **Can I customize the behavior of the reset and restart functions?**

Yes, the `reset` and `restart` functions accept optional values that allow you to customize the time to reset or restart the countdown.

### 7. **Is there a maximum or minimum limit for the countdown time?**

Yes, the library enforces a minimum value of 1 second and a maximum of 99 days (8,553,600 seconds). The input is automatically validated to stay within these limits.

### 8. **Can I use multiple countdowns in a single component?**

Absolutely. You can use multiple instances of the `useCountdown` hook in a single component to handle multiple countdowns simultaneously.

### 9. **How does the library handle timer accuracy?**

The countdown timer uses JavaScript's `setInterval` with a 1-second interval. For most use cases, this is accurate enough. However, for very high-precision timing, it’s recommended to handle timing through server-side solutions.

### 10. **Does the library support countdown completion callbacks?**

Yes, you can monitor the `CountdownState.COMPLETED` state and trigger callbacks or perform actions when the countdown reaches zero.
