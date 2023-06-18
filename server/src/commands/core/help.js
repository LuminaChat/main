/*
  Description: Outputs the current command module list or command categories
  已汉化
*/

// module main
export async function run(core, server, socket, payload) {
  // check for spam
  if (server.police.frisk(socket.address, 2)) {
    return server.reply({
      cmd: 'warn',
      text: '你发送的速度太快了，请稍后再试。',
    }, socket);
  }

  // 检查用户的输入
  if (typeof payload.command !== 'undefined' && typeof payload.command !== 'string') {
    return true;
  }

  let reply = '';
  if (typeof payload.command === 'undefined') {
    reply += '# 所有指令:\n|分类:|指令名:|\n|---:|---|\n';

    const categories = core.commands.categoriesList.sort();
    for (let i = 0, j = categories.length; i < j; i += 1) {
      reply += `|${categories[i].replace('../src/commands/', '').replace(/^\w/, (c) => c.toUpperCase())}:|`;
      const catCommands = core.commands.all(categories[i]).sort((a, b) => a.info.name.localeCompare(b.info.name));
      reply += `${catCommands.map((c) => `${c.info.name}`).join(', ')}|\n`;
    }

    reply += '---\n对于指定命令的详细帮助菜单:\n文本: `/help <指令名>`\nAPI: `{cmd: \'help\', command: \'<指令名>\'}`';
  } else {
    const command = core.commands.get(payload.command);

    if (typeof command === 'undefined') {
      reply += '未知命令';
    } else {
      reply += `# ${command.info.name} command:\n| | |\n|---:|---|\n`;
      reply += `|**名称:**|${command.info.name}|\n`;
      reply += `|**别名:**|${typeof command.info.aliases !== 'undefined' ? command.info.aliases.join(', ') : 'None'}|\n`;
      reply += `|**分类:**|${command.info.category.replace('../src/commands/', '').replace(/^\w/, (c) => c.toUpperCase())}|\n`;
      reply += `|**必须参数:**|${command.requiredData || '无'}|\n`;
      reply += `|**介绍:**|${command.info.description || '无 *¯\_(ツ)_/¯*'}|\n\n`;
      reply += `**用法:** ${command.info.usage || command.info.name}`;
    }
  }

  // output reply
  server.reply({
    cmd: 'info',
    text: reply,
  }, socket);

  return true;
}

// module hook functions
export function initHooks(server) {
  server.registerHook('in', 'chat', this.helpCheck.bind(this), 28);
}

// hooks chat commands checking for /whisper
export function helpCheck(core, server, socket, payload) {
  if (typeof payload.text !== 'string') {
    return false;
  }

  if (payload.text.startsWith('/help')) {
    const input = payload.text.substr(1).split(' ', 2);

    this.run(core, server, socket, {
      cmd: input[0],
      command: input[1],
    });

    return false;
  }

  return payload;
}

export const info = {
  name: 'help',
  description: '输出帮助菜单',
  usage: `
    API: { cmd: 'help', command: '<可选的指令名>' }
    Text: /help <可选的指令名>`,
};
