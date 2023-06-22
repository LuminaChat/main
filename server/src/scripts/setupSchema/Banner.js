/**
  * This script will be run before the package starts asking for the config data,
  * used to output a simple guide for the coming questions, or to spam some sexy
  * ascii art at the user.
  *
  */

import { stripIndents } from 'common-tags';
import chalk from 'chalk';

// gotta have that sexy console
console.log(stripIndents`
  ${chalk.magenta('°º¤ø,¸¸,ø¤º°`°º¤ø,¸,ø¤°º¤ø,¸¸,ø¤º°`°º¤ø,¸°º¤ø,¸¸,ø¤º°`°º¤ø')}
  ${chalk.gray('--------------(') + chalk.white(' LuminaChat 安装指导 ') + chalk.gray(')--------------')}
  ${chalk.magenta('°º¤ø,¸¸,ø¤º°`°º¤ø,¸,ø¤°º¤ø,¸¸,ø¤º°`°º¤ø,¸°º¤ø,¸¸,ø¤º°`°º¤ø')}

  了解更多，请查看:
  ${chalk.green('https://github.com/LuminaChat/main')}

  ${chalk.white('提示:')} ${chalk.green('npm/yarn run config')} 会重新运行此程序.

  You will now be asked for the following:
  -  ${chalk.magenta('      混淆值')}, 来让加密更安全
  -  ${chalk.magenta('    站长名称')}, 字面意思
  -  ${chalk.magenta('    站长密码')}, 字面意思
  -  ${chalk.magenta('        端口')}, Websocket服务端口
  \u200b
`);
