/*
  Description: Forces a change on the target(s) socket's channel, then broadcasts event
*/

import * as UAC from '../utility/UAC/_info';

// module main
export async function run(core, server, socket, data) {
  // increase rate limit chance and ignore if not admin or mod
  if (!UAC.isModerator(socket.level)) {
    return server.police.frisk(socket.address, 10);
  }

  // check user input
  if (typeof data.nick !== 'string') {
    if (typeof data.nick !== 'object' && !Array.isArray(data.nick)) {
      return true;
    }
  }

  let destChannel;
  if (typeof data.to === 'string' && !!data.to.trim()) {
    destChannel = data.to;
  } else {
    destChannel = Math.random().toString(36).substr(2, 8);
  }

  // find target user(s)
  const badClients = server.findSockets({ channel: socket.channel, nick: data.nick });

  if (badClients.length === 0) {
    return server.reply({
      cmd: 'warn',
      text: '找不到用户',
    }, socket);
  }

  // check if found targets are kickable, add them to the list if they are
  const kicked = [];
  for (let i = 0, j = badClients.length; i < j; i += 1) {
    if (badClients[i].level >= socket.level) {
      server.reply({
        cmd: 'warn',
        text: '你不能踢出同级别或更高级别的用户！',
      }, socket);
    } else {
      kicked.push(badClients[i]);
    }
  }

  if (kicked.length === 0) {
    return true;
  }

  // Announce the kicked clients arrival in destChannel and that they were kicked
  // Before they arrive, so they don't see they got moved
  for (let i = 0; i < kicked.length; i += 1) {
    server.broadcast({
      cmd: 'onlineAdd',
      nick: kicked[i].nick,
      trip: kicked[i].trip || 'null',
      hash: kicked[i].hash,
    }, { channel: destChannel });
  }

  // Move all kicked clients to the new channel
  for (let i = 0; i < kicked.length; i += 1) {
    kicked[i].channel = destChannel;

    server.broadcast({
      cmd: 'info',
      text: `${kicked[i].nick} 被踢到了 ?${destChannel}`,
    }, { channel: socket.channel, level: UAC.isModerator });

    console.log(`${socket.nick} [${socket.trip}] 把 ${kicked[i].nick} 从 ${socket.channel} 踢出到 ${destChannel} `);
  }


  // broadcast client leave event
  for (let i = 0, j = kicked.length; i < j; i += 1) {
    server.broadcast({
      cmd: 'onlineRemove',
      nick: kicked[i].nick,
    }, { channel: socket.channel });
  }

  // publicly broadcast kick event
  server.broadcast({
    cmd: 'info',
    text: `已踢出 ${kicked.map((k) => k.nick).join(', ')}`,
  }, { channel: socket.channel, level: (level) => level < UAC.levels.moderator });

  // stats are fun
  core.stats.increment('users-kicked', kicked.length);

  return true;
}

export const requiredData = ['nick'];
// 等着做Text踢人功能（
export const info = {
  name: 'kick',
  description: '安静地把人移到另一个房间（人话：踢人）. `nick` 可以为字符串或字符串数数组',
  usage: `
    API: { cmd: 'kick', nick: '<用户名>', to: '<可选：踢出到的频道>' }`,
};
