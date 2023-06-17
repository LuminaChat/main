/*
  Description: Legacy stats output, kept for compatibility, outputs user and channel count
*/

// module main
export async function run(core, server, socket) {
  // gather connection and channel count
  let ips = {};
  let channels = {};
  // for (const client of server.clients) {
  server.clients.forEach((client) => {
    if (client.channel) {
      channels[client.channel] = true;
      ips[client.address] = true;
    }
  });

  const uniqueClientCount = Object.keys(ips).length;
  const uniqueChannels = Object.keys(channels).length;

  ips = null;
  channels = null;

  // dispatch info
  server.reply({
    cmd: 'info',
    text: `${uniqueClientCount} 个独立IP在 ${uniqueChannels} 个频道中`,
  }, socket);

  // stats are fun
  core.stats.increment('stats-requested');
}

export const info = {
  name: 'stats',
  description: '将服务器统计信息发回给调用的客户端',
  usage: `
    API: { cmd: 'stats' }`,
};
