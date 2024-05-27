import consoleKit from "./lib/console-kit";
import { displayTitle } from "./utils/ascii";
import { testProxies, checkProxiesList } from "./proxy";

(async () => {
    process.title = "Proximus";

    displayTitle();
    consoleKit.info("Checking proxies.txt...");

    const proxiesList = checkProxiesList();
    if (!proxiesList) {
        consoleKit.x(
            "There's no proxies listed in proxies.txt. Add at least one."
        );
        process.exit();
    }

    consoleKit.check(`${proxiesList.length} proxies found.`);
    testProxies(proxiesList);
})();
