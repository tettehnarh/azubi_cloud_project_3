const aws = require("aws-sdk");
const ses = new aws.SES();

exports.handler = async (event) => {
  for (const streamedItem of event.Records) {
    if (
      streamedItem.eventName === "INSERT" ||
      streamedItem.eventName === "MODIFY"
    ) {
      const userEmail = streamedItem.dynamodb.NewImage.userName.S;

      await ses
        .sendEmail({
          Destination: {
            ToAddresses: [userEmail],
          },
          Source: process.env.SES_EMAIL,
          Message: {
            Subject: { Data: "Welcome to Gold Grid" },
            Body: {
              Text: {
                Data: "Thank you for filling out the form. Welcome to the Gold Grid family.",
              },
            },
          },
        })
        .promise();
    }
  }
  return { status: "done" };
};
