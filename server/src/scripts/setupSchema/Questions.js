/**
  * This object contains Prompt ( https://www.npmjs.com/package/prompt ) style
  * questions that the SetupWizard will require an answer to. Questions are asked
  * in the order they are specified here.
  *
  * The resulting config.json file will be used by the server, accessed by the
  * name specified. IE, a valid use is; config.adminName
  *
  */

const Questions = {
  properties: {
    tripSalt: {
      description: '混淆值 (推荐留空)',
      type: 'string',
      hidden: true,
      replace: '*',
      before: (value) => {
        salt = value;
        return value;
      },
    },

    adminName: {
      description: '站长名称',
      pattern: /^"?[a-zA-Z0-9_]+"?$/,
      type: 'string',
      message: '站长名称仅可包含字母、数字、下划线。',
      before: (value) => value.replace(/"/g, ''),
    },

    adminTrip: {
      type: 'string',
      hidden: true,
      replace: '*',
      description: '站长密码',
      message: '你必须输入一个密码。',
      before: (value) => {
        const crypto = require('crypto');
        const sha = crypto.createHash('sha256');
        sha.update(value + salt);
        return sha.digest('base64').substr(0, 6);
      },
    },

    websocketPort: {
      type: 'integer',
      message: '端口只能是一个数字！',
      description: 'Websocket Port',
      default: '6060',
    },
  },
};

module.exports = Questions;
