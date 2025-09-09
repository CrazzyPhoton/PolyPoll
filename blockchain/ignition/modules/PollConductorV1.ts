import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PollConductorV1Module", (m) => {
  const pollConductor = m.contract("PollConductorV1");
  return { pollConductor };
});
