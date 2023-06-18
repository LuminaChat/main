/**
  * LuminaChat main server entry point
  * @author Marzavec ( https://github.com/marzavec )
  * @author MaggieLOL ( https://github.com/MaggieLOL )
  * @version v2.0.0
  * @license AGPL3.0 (https://github.com/LuminaChat/main/blob/main/LICENSE)
  */

// import and initialize the core application
import { CoreApp } from './src/serverLib/CoreApp';

const coreApp = new CoreApp();
coreApp.init();
