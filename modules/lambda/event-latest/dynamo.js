const AWS = require("aws-sdk");

let REGION = process.env.REGION;

AWS.config.update({ region: REGION });

const ddb = new AWS.DynamoDB.DocumentClient();

const Dynamo = {
  async get(ID, TableName) {
    const params = {
      TableName,
      Key: {
        ID,
      },
    };

    const data = await ddb.get(params).promise();

    if (!data || !data.Item) {
      throw Error(`There was an error`);
    }
    return data.Item;
  },

  async delete(ID, TableName) {
    const params = {
      TableName,
      Key: {
        ID,
      },
    };

    const data = await ddb.delete(params).promise();

    return data;
  },

  async write(data, TableName) {
    if (!data.ID) {
      throw Error("no ID on the data");
    }

    const params = {
      TableName,
      Item: data,
    };

    const res = await ddb.put(params).promise();

    if (!res) {
      throw Error(
        `There was an error inserting ID of ${data.ID} in table ${TableName}`,
      );
    }

    return data;
  },
};

module.exports = Dynamo;
