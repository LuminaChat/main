/*
  Description: Writes the current config to disk
  已汉化
*/

import * as UAC from '../utility/UAC/_info';

// module main
export async function run(core, server, socket) {
  // increase rate limit chance and ignore if not admin
  if (!UAC.isAdmin(socket.level)) {
    return server.police.frisk(socket.address, 20);
  }

  // attempt save, notify of failure
  if (!core.configManager.save()) {
    return server.reply({
      cmd: 'warn',
      text: '无法保存配置，请查看日志.',
    }, socket);
  }

  // return success message to moderators and admins
  server.broadcast({
    cmd: 'info',
    text: '成功保存配置！',
  }, { level: UAC.isModerator });

  return true;
}

export const info = {
  name: 'saveconfig',
  description: '将当前配置写入磁盘',
  usage: `
    API: { cmd: 'saveconfig' }`,
};
