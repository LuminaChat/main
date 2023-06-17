/*
  Description: Used to relay warnings to clients internally
*/

// module main
export async function run(core, server, socket, data) {
  if (data.cmdKey !== server.cmdKey) {
    // internal command attempt by client, increase rate limit chance and ignore
    return server.police.frisk(socket.address, 20);
  }

  // send warning to target socket
  server.reply({ cmd: 'warn', text: data.text }, socket);

  return true;
}

export const requiredData = ['cmdKey', 'text'];
export const info = {
  name: 'socketreply',
  usage: '仅供内部使用',
  description: '向客户端发送警告',
};
