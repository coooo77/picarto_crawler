export interface ChannelResponse {
  channel: {
    id: number
    name: string
    online: boolean
    private: boolean
    /** golive+name */
    stream_name: string
  }
  getLoadBalancerUrl: {
    /** 'https://edge1-eu-west.picarto.tv' */
    url: string
    /** 'edge1-eu-west */
    origin: string
  }
}
