import path from 'path'
import cp from 'child_process'

import api from './api'
import fileSys from './file'
import common from './common'

import type { ChannelResponse } from '../interfaces/api'
import type { RecordSetting } from '../interfaces/common'
import type { AppSetting } from '../interfaces/common.js'
import type { RecordingUsers } from '../interfaces/recordModal'

class Main {
  runtimeCount = 0

  retryTimers: Record<ChannelResponse['channel']['name'], NodeJS.Timeout> = {}

  _recordList: RecordingUsers = {}

  get recordList() {
    return this._recordList
  }

  set recordList(value: RecordingUsers) {
    fileSys.saveJSONFile(fileSys.modalPath, value)

    this._recordList = value
  }

  _appSetting: AppSetting | null = null

  get appSetting() {
    return this._appSetting || fileSys.getAppSetting()
  }

  init() {
    process.once('SIGINT', () => {
      const recordList = fileSys.getModal()
      Object.values(recordList).forEach((info) => common.killProcess(info.pid))
      this.recordList = {}
      process.exit()
    })
  }

  async start() {
    const { checkStreamInterval = 30, targetChannels } = this.appSetting

    try {
      common.msg(`Check online list at ${new Date().toLocaleString()} for ${++this.runtimeCount} times`)

      for (const channel of targetChannels) {
        const isRecording = this.recordList[channel.toLowerCase()]
        if (isRecording) {
          common.msg(`${channel} is streaming at https://picarto.tv/${channel}`)
          continue
        }

        await this.checkChannel(channel)
      }

      console.log('\r')
    } catch (error) {
      fileSys.errorHandler(error, 'main > start')
    } finally {
      setTimeout(this.start.bind(this), checkStreamInterval * 1000)
    }
  }

  async checkChannel(channelName: string) {
    const {
      data: { channel, getLoadBalancerUrl },
    } = await api.getChannel(channelName)

    if (!channel.online) return

    common.msg(`${channel.name} is online, start to record`)

    const m3u8_Url = this.getM3u8(getLoadBalancerUrl.url, channel.stream_name)
    this.handleRecord(m3u8_Url, channel.name)
  }

  getM3u8(baseURL: string, streamName: string) {
    return `${baseURL}/stream/hls/${String(streamName).replace('+', '%2b')}/1_0/index.m3u8`
  }

  timeString() {
    const timeNow = new Date()

    const year = timeNow.getFullYear()
    const month = timeNow.getMonth() + 1
    const day = timeNow.getDate()
    const hour = timeNow.getHours()
    const minute = timeNow.getMinutes()
    const second = timeNow.getMinutes()

    const pre = [year, month, day].map((i) => String(i).padStart(2, '0')).join('')
    const post = [hour, minute, second].map((i) => String(i).padStart(2, '0')).join('')

    return { pre, post }
  }

  getOutPutFileName(setting: RecordSetting, streamerName: string) {
    const { saveFolder, prefix } = setting
    fileSys.makeDirIfNotExist(saveFolder)
    const { pre, post } = this.timeString()
    const filename = `${prefix}${streamerName}_picarto_${pre}_${post}.ts`
    return path.join(saveFolder, filename)
  }

  handleEndStream(streamerName: string) {
    delete this.retryTimers[streamerName]

    const latestList = fileSys.getModal()
    delete latestList[streamerName]

    this.recordList = latestList
  }

  handleRecord(m3u8_Url: string, streamerName: string, retryCount = 0) {
    const { recordSetting } = this.appSetting

    if (retryCount >= recordSetting.maxTryTimes) {
      common.msg(`${streamerName} reached max retries`)
      this.handleEndStream(streamerName)
      return Promise.resolve(1)
    }

    return new Promise((res) => {
      const filename = this.getOutPutFileName(recordSetting, streamerName)
      const task = cp.spawn('ffmpeg', `-i ${m3u8_Url} -y -c copy ${filename}`.split(' '))

      const recordList = this.recordList
      recordList[streamerName.toLowerCase()] = {
        retryCount,
        pid: task.pid,
        name: streamerName,
        startAt: new Date().toLocaleString(),
      }
      this.recordList = recordList

      task.stderr.setEncoding('utf8')
      task.stderr.on('data', (msg: string) => {
        if (msg.includes('Invalid data found when processing input')) {
          common.msg(`Error: Invalid data found when processing input for streamer ${streamerName}`, 'warn')
          common.killProcess(task.pid)
        } else {
          clearTimeout(this.retryTimers[streamerName])

          this.retryTimers[streamerName] = setTimeout(async () => {
            common.killProcess(task.pid)
            await common.wait(recordSetting.reTryInterval)
            this.handleRecord(m3u8_Url, streamerName, ++retryCount)
          }, recordSetting.restartInterval * 1000)
        }
      })

      task.on('spawn', () => {
        common.msg(`start to record streamer ${streamerName}`)
      })

      task.on('close', (code) => {
        common.msg(`stop recording streamer ${streamerName} at code ${code}`)
        this.handleEndStream(streamerName)
        res(code)
      })
    })
  }
}

export default new Main()
