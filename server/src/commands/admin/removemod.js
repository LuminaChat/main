/*
  Description: Removes target trip from the config as a mod and downgrades the socket type
  已汉化
*/

import * as UAC from '../utility/UAC/_info';

// module main
export async function run(core, server, socket, data) {
  // increase rate limit chance and ignore if not admin
  if (!UAC.isAdmin(socket.level)) {
    return server.police.frisk(socket.address, 20);
  }

  // remove trip from config
  core.config.mods = core.config.mods.filter((mod) => mod.trip !== data.trip);

  // find targets current connections
  const targetMod = server.findSockets({ trip: data.trip });
  if (targetMod.length !== 0) {
    for (let i = 0, l = targetMod.length; i < l; i += 1) {
      // downgrade privilages
      targetMod[i].uType = 'user';
      targetMod[i].level = UAC.levels.default;

      // inform ex-mod
      server.send({
        cmd: 'info',
        text: '您的管理员权限已被移除',
      }, targetMod[i]);
    }
  }

  // return success message
  server.reply({
    cmd: 'info',
    text: `删除了一个管理员: ${
      data.trip
    }, 记得运行\`saveconfig\`，不然他的权限还会回来`,
  }, socket);

  // notify all mods
  server.broadcast({
    cmd: 'info',
    text: `成功移除管理员: ${data.trip}`,
  }, { level: UAC.isModerator });

  return true;
}

export const requiredData = ['trip'];
export const info = {
  name: 'removemod',
  description: '移除一个管理员',
  usage: `
    API: { cmd: 'removemod', trip: '<目标用户识别码>' }`,
};
