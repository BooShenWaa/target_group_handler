const Dynamo = require("./dynamo");
const {
  GetResourceID,
  RegisterNewTarget,
  DeregisterTarget,
} = require("./functions.js");

// Lambda Variables
let NLB_TARGET_GROUP_ARN = process.env.NLB_TARGET_GROUP_ARN;
let NLB_TARGET_PORT = process.env.NLB_TARGET_PORT;
let ALB_ARN = process.env.ALB_ARN;
let DYNAMO_TABLE = process.env.DYNAMO_TABLE;

exports.handler = async (event) => {
  const input = event.detail;

  console.log("Determening event type...");

  if (input.eventName == "CreateNetworkInterface") {
    console.log("CreateNetworkInterface event detected...");
    // Pull required information from the event
    const eventDescription = input.requestParameters.description;
    const eventResourceID = eventDescription.split("/")[2];
    const ALB_RESOURCE_ID = GetResourceID(ALB_ARN);
    const createEventIp =
      input.responseElements.networkInterface.privateIpAddress;
    const eniID = input.responseElements.networkInterface.networkInterfaceId;

    // Confirm even matches the correct ALB
    if (ALB_RESOURCE_ID == eventResourceID) {
      console.log(
        "Attempting to register: ",
        createEventIp + " to " + NLB_TARGET_GROUP_ARN,
      );

      // Register IP to NLB TG
      await RegisterNewTarget(
        NLB_TARGET_GROUP_ARN,
        NLB_TARGET_PORT,
        createEventIp,
      );

      const newEntry = {
        ID: eniID,
        IP: createEventIp,
      };

      // Add entry to the DynamoDB table
      console.log("Writing to table...");
      await Dynamo.write(newEntry, DYNAMO_TABLE);
      return;
    } else {
      console.log(
        "Event does not match the Application Load Balancer selected",
      );
      return;
    }
  } else if (input.eventName == "DeleteNetworkInterface") {
    console.log("DeleteNetworkInterface event detected...");

    const eventEni = input.requestParameters.networkInterfaceId;

    console.log("EventEni:", eventEni);

    try {
      await DeregisterTarget(NLB_TARGET_GROUP_ARN, NLB_TARGET_PORT, eventEni);

      console.log("Removing entry from table...");
      await Dynamo.delete(eventEni, DYNAMO_TABLE);
      return;
    } catch (error) {
      console.log("Err: ", error);
      return;
    }
  } else {
    return;
  }
};
