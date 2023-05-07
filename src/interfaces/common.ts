export type LogMsgType = 'warn' | 'info' | 'success' | 'fail' | 'error'

export interface AppSetting {
  targetChannels: string[]
  recordSetting: RecordSetting
  checkStreamInterval: number
}

export interface RecordSetting {
  maxTryTimes: number
  /** sec */
  reTryInterval: number
  /** if ffmpeg stop outputting msg over ${restartInterval} sec, then kill process */
  restartInterval: number
  saveFolder: string
  prefix: string
}
