import api from './axios'

import type { ChannelResponse } from '../interfaces/api'

export default {
  getChannel(channelName: string) {
    return api.get<ChannelResponse>(`channel/detail/${channelName}`)
  },
}
