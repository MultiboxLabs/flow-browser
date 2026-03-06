import { tabDialogsController } from "@/controllers/tabs-controller/tab-dialogs-controller";
import { type Protocol } from "electron";

export function registerFlowDialogProtocol(protocol: Protocol) {
  protocol.handle("flow-dialog", async (request) => {
    return tabDialogsController.handleProtocolRequest(request);
  });
}
