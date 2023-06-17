/*
  Description: Clears and resets the command modules, outputting any errors
  已汉化
*/

import * as UAC from '../utility/UAC/_info';

// module main
export async function run(core, server, socket, data) {
  // increase rate limit chance and ignore if not admin
  if (!UAC.isAdmin(socket.level)) {
    return server.police.frisk(socket.address, 20);
  }

  // do command reload and store results
  let loadResult = core.dynamicImports.reloadDirCache();
  loadResult += core.commands.loadCommands();

  // clear and rebuild all module hooks
  server.loadHooks();

  // build reply based on reload results
  if (loadResult === '') {
    loadResult = `成功重载 ${core.commands.commands.length} 个命令, 神奇的是竟然没有出错.`;
  } else {
    loadResult = `成功重载 ${core.commands.commands.length} 个命令, 出了一些错误:
      ${loadResult}`;
  }

  if (typeof data.reason !== 'undefined') {
    loadResult += `\n原因: ${data.reason}`;
  }

  // send results to moderators (which the user using this command is higher than)
  server.broadcast({
    cmd: 'info',
    text: loadResult,
  }, { level: UAC.isModerator });

  return true;
}

export const info = {
  name: 'reload',
  description: '热重载所有命令',
  usage: `
    API: { cmd: 'reload', reason: '<可选的附加原因>' }`,
};
