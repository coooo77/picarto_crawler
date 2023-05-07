import type { ChannelResponse } from './api'

export interface OnlineUser extends Pick<ChannelResponse['channel'], 'name'> {
  pid?: number
  startAt: string
  retryCount?: number
}

export type RecordingUsers = Record<ChannelResponse['channel']['name'], OnlineUser>
