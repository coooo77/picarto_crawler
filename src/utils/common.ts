import chalk from 'chalk'
import cp from 'child_process'

import type { LogMsgType } from '../interfaces/common'

export default {
  msg(msg: string, msgType: LogMsgType = 'info') {
    const { log } = console

    const type = ` ${msgType.toUpperCase()} `

    switch (msgType) {
      case 'warn':
        log(chalk.bgYellow(type), chalk.yellow(msg))
        break
      case 'info':
        log(chalk.bgBlue(type), chalk.blue(msg))
        break
      case 'success':
        log(chalk.bgGreen(type), chalk.green(msg))
        break
      case 'fail':
        log(chalk.bgRed(type), chalk.red(msg))
        break
      case 'error':
        log(chalk.bgRed(type), chalk.bgRed.yellow(msg))
        break
      default:
        break
    }
  },

  isProcessRunning(pid?: number) {
    if (typeof pid === 'undefined') return false

    try {
      process.kill(pid, 0)
      return true
    } catch {
      return false
    }
  },

  wait: (seconds: number) => new Promise((resolve) => setTimeout(resolve, seconds * 1000)),

  killProcess(pid?: number, signal: string | number = 'SIGTERM') {
    if (typeof pid === 'undefined') return

    if (process.platform == 'win32') {
      cp.exec(`taskkill /PID ${pid} /T /F`)
    } else {
      process.kill(-pid, signal)
    }
  },
}
