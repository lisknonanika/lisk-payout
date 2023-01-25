import { send } from './job';

(async () => {
  try {
    await send();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
