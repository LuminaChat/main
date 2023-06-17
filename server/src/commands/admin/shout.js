/*
  Description: Emmits a server-wide message as `info`
  已汉化
*/

import * as UAC from '../utility/UAC/_info';

// module main
export async function run(core, server, socket, data) {
  // increase rate limit chance and ignore if not admin
  if (!UAC.isAdmin(socket.level)) {
    return server.police.frisk(socket.address, 20);
  }

  // send text to all channels
  server.broadcast({
    cmd: 'info',
    text: `全体通知: ${data.text}`,
  }, {});

  return true;
}

export const requiredData = ['text'];
export const info = {
  name: 'shout',
  description: '全服喊话',
  usage: `
    API: { cmd: 'shout', text: '<消息>' }`,
};
