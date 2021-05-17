let REGION = process.env.REGION;
let DYNAMO_TABLE = process.env.DYNAMO_TABLE;

const AWS = require("aws-sdk");
const elbv2 = new AWS.ELBv2({ region: REGION });
const Dynamo = require("./dynamo");

// ARN Splitter - used to get resource ID from ARN
const splitter = require("aws-arn-splitter");

const GetResourceID = (arn) => {
  const splitedArn = splitter(arn);
  const array = splitedArn.path.split("/");
  const resourceId = array[array.length - 1];

  return resourceId;
};

// const RegisterNewTarget = async (
//   NLB_TARGET_GROUP_ARN,
//   NLB_TARGET_PORT,
//   eventIp,
// ) => {
//   const registerParams = {
//     TargetGroupArn: NLB_TARGET_GROUP_ARN,
//     Targets: [
//       {
//         Id: eventIp,
//         Port: NLB_TARGET_PORT,
//       },
//     ],
//   };

//   const resp = await elbv2.registerTargets(
//     registerParams,
//     function (err, data) {
//       if (err) console.log(err, err.stack);
//       else {
//         console.log(
//           "Registering " +
//             eventIp +
//             " to Target Group: " +
//             resp.params.TargetGroupArn,
//         );
//         return;
//       }
//     },
//   );
// };

const RegisterNewTarget = async (
  NLB_TARGET_GROUP_ARN,
  NLB_TARGET_PORT,
  eventIp,
) => {
  try {
    const registerParams = {
      TargetGroupArn: NLB_TARGET_GROUP_ARN,
      Targets: [
        {
          Id: eventIp,
          Port: NLB_TARGET_PORT,
        },
      ],
    };

    const resp = await elbv2.registerTargets(registerParams).promise();
    console.log(
      "Registering " + eventIp + " to Target Group: " + NLB_TARGET_GROUP_ARN,
    );
    return resp;
  } catch (error) {
    console.log("Error: ", error.stack);
  }
};

// const DeregisterTarget = async (
//   NLB_TARGET_GROUP_ARN,
//   NLB_TARGET_PORT,
//   eventEni,
// ) => {
//   try {
//     const data = await Dynamo.get(eventEni, DYNAMO_TABLE);
//     // console.log("Data from table: ", data);

//     const deregisterParams = {
//       TargetGroupArn: NLB_TARGET_GROUP_ARN,
//       Targets: [
//         {
//           Id: data.IP,
//           Port: NLB_TARGET_PORT,
//         },
//       ],
//     };
//     try {
//       await elbv2.deregisterTargets(deregisterParams, function (err, data) {
//         if (err) console.log(err, err.stack);
//         else {
//           console.log("Deregistering ", deregisterParams);

//           return;
//         }
//       });
//     } catch (error) {
//       console.log("Error: ", error);
//     }
//   } catch (err) {
//     console.log(err);
//   }
// };

const DeregisterTarget = async (
  NLB_TARGET_GROUP_ARN,
  NLB_TARGET_PORT,
  eventEni,
) => {
  try {
    const data = await Dynamo.get(eventEni, DYNAMO_TABLE);

    const deregisterParams = {
      TargetGroupArn: NLB_TARGET_GROUP_ARN,
      Targets: [
        {
          Id: data.IP,
          Port: NLB_TARGET_PORT,
        },
      ],
    };

    const resp = await elbv2.deregisterTargets(deregisterParams).promise();
    console.log("Deregistering ", deregisterParams);

    return resp;
  } catch (error) {
    console.log("Error: " + error.stack);
  }
};

module.exports = { RegisterNewTarget, GetResourceID, DeregisterTarget };
