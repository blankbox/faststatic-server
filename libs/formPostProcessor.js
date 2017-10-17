const Slack = require('slack-node');
const Validator = require('jsonschema').Validator;

function formPostProcessor (req, res) {
  const settings = req.settings;

  console.log('form submitted', settings);

  if (typeof settings.slack_key !== 'undefined') {

    console.log('using slack key');

    let slack = new Slack();
    slack.setWebhook(settings.slack_key);

    // Setup to read in each form value and push in to array
    let bodyKeys = Object.keys(req.body);

    let message = `-------------------------------\nsite: ${req.sitename}\nenv: ${process.env.TYPE}\n`;

    for(let key in bodyKeys) {
      message += `${bodyKeys[key]}: ${req.body[bodyKeys[key]]}\n`;
    }

    // Success/Error Response Messages
    const errorRes = {
      "formError": "Errors found in submitted form, please try again.",
      "serverError": "Something went wrong - try again!"
    };

    const successRes = {
      "formSuccess": "Form submitted successfully!"
    };


    // only validate forms with validation
    // @TODO update this with better error ahdnling so that no forms are submitted without validation
    if (typeof settings.schema !== 'undefined') {

      // Decision made as to what form has been submitted
      // Fields validated then string constructed to be sent
      const v = new Validator();

      let schema = JSON.parse(settings.schema);
      let addedSchema = schema[req.body['form']];
      v.addSchema(addedSchema, '/' + req.body['form']);

      let validation = v.validate(req.body, addedSchema);
      if(validation.errors.length != 0) {
        console.log('error', validation.errors);
        return res.json({ "message":errorRes.formError });
      }

      slack.webhook({
        channel: "#testing",
        username: "webhookbot",
        icon_emoji: ":ghost:",
        text: message
      },
      function(err, response) {
            if (err != null) {
              return res.status(500).json({
                "type":"error",
                "message":errorRes.serverError,
                "log":err
              });
            } else {
              return res.status(response.statusCode).json({
                "type":"success",
                "message":successRes.formSuccess
              });
            }
      });


    } else {
      return res.json({ "message": "no schema"});
    }


  } else {
    return res.json({ "message": "no form handler"});
  }
}

module.exports = formPostProcessor;