import { mailtrapClient, sender } from "../lib/mailtrap.js";
import { createWelcomeEmailTemplate } from "./emailTemplates.js";

export const sendWelcomeMail = async (email, name, profileURL) => {
  const recipient = [{ email }];
// const recipient = [{ email: "rishabhid777@gmail.com" }]; // ✅ Correct format


  try {
    const response = await mailtrapClient.send({
      from: sender, 
      to: recipient,
      subject: "Welcome to ConnectIn",
      html: createWelcomeEmailTemplate(name, profileURL),
      category: "welcome",
    });
    console.log("Welcome Email sent Successfully", response);
  } catch (error) {
    throw error;
  }
};

// export const sendCommentNotificationEmail = async ( recipientEmail, recipientName, commenterName, postUrl, comment) => {
//   const recipient = [{ email: recipientEmail }];
//   try {
//     const response = await mailtrapClient.send({
//       from: sender,
//       to: recipient,
//       subject: "New Comment on Your Post",
//       html: createCommentNotificationEmailTemplate(recipientName, commenterName, postUrl, comment),
//       category: "comment",
//     });
//     console.log("Comment Notification Email sent Successfully", response);
//   } catch (error) {
//     throw error;
//   }
// }


// export const sendConnectionAcceptedEmail = async (senderEmail, senderName, recipientName, profileUrl) => {
// 	const recipient = [{ email: senderEmail }];

// 	try {
// 		const response = await mailtrapClient.send({
// 			from: sender,
// 			to: recipient,
// 			subject: `${recipientName} accepted your connection request`,
// 			html: createConnectionAcceptedEmailTemplate(senderName, recipientName, profileUrl),
// 			category: "connection_accepted",
// 		});
// 	} catch (error) {}
// };