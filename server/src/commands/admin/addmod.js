/*
  Description: Adds the target trip to the mod list then elevates the uType
*/

import * as UAC from '../utility/UAC/_info';

// module main
export async function run(core, server, socket, data) {
  // increase rate limit chance and ignore if not admin
  if (!UAC.isAdmin(socket.level)) {
    return server.police.frisk(socket.address, 20);
  }

  // add new trip to config
  core.config.mods.push({ trip: data.trip });

  // find targets current connections
  const newMod = server.findSockets({ trip: data.trip });
  if (newMod.length !== 0) {
    for (let i = 0, l = newMod.length; i < l; i += 1) {
      // upgrade privilages
      newMod[i].uType = 'mod';
      newMod[i].level = UAC.levels.moderator;

      // inform new mod
      server.send({
        cmd: 'info',
        text: '你现在是一个管理员',
      }, newMod[i]);
    }
  }

  // return success message
  server.reply({
    cmd: 'info',
    text: `添加了一个管理员识别码: ${data.trip}, 运行\`saveconfig\`来保存配置`,
  }, socket);

  // notify all mods
  server.broadcast({
    cmd: 'info',
    text: `添加了一个管理员识别码：${data.trip}`,
  }, { level: UAC.isModerator });

  return true;
}

export const requiredData = ['trip'];
export const info = {
  name: 'addmod',
  description: '添加一个管理员识别码到配置文件中',
  usage: `
    API: { cmd: 'addmod', trip: '<识别码>' }`,
};
