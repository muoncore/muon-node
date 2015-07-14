var oboe = require('oboe');
var fs = require('fs');

var counter = 0;
var curentTimeStamp = null;
var summary = {};

function buildData( keywords, sentiment, callback) {

  var i=0;

  for (i=0; i<keywords.length; i++) {

    //Build Date
    var myDate = new Date(curentTimeStamp);
    var dd = myDate.getDate().toString();
    var mm = (myDate.getMonth()+1).toString();
    var yyyy = myDate.getFullYear().toString();

    var thisDate = yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]);

    //Create date structure
    if (!(thisDate in summary)) {
        //No date object, so create date object
        summary[thisDate] = {};
    }

    //Check for keyword
    if (keywords[i].phrase in summary[thisDate]) {

      //Increment counters
      summary[thisDate][keywords[i].phrase][count] = summary[thisDate][keywords[i].phrase][count]++;

      //Add sentiment
      summary[thisDate][keywords[i].phrase][sentiment] = summary[thisDate][keywords[i].phrase][sentiment] + sentiment;

      //Update Average
      summary[thisDate][keywords[i].phrase][average_sentiment] = (summary[thisDate][keywords[i].phrase][sentiment] / summary[thisDate][keywords[i].phrase][count]);

      //Update min_sentiment
      if ( (summary[thisDate][keywords[i].phrase][min_sentiment]) < sentiment ) {
        (summary[thisDate][keywords[i].phrase][min_sentiment]) = sentiment;
      }

      //Update max_sentiment
      if ( (summary[thisDate][keywords[i].phrase][max_sentiment]) < sentiment ) {
        (summary[thisDate][keywords[i].phrase][max_sentiment]) = sentiment;
      }

    }
    else {
      //Create keyword object
      summary[thisDate][keywords[i].phrase] = { "keyphrase": keywords[i].phrase, "count": 1, "sentiment": sentiment, "min_sentiment": sentiment, "average_sentiment": sentiment, "max_sentiment": sentiment, "normalised_sentiment": sentiment};
    }

    //console.log(summary);

    //Output data
    //console.log(thisDate + ': ' + keywords[i].phrase + " " + keywords[i].count + " " + sentiment);
    //console.log(keywords[i].phrase);

  }

  //console.log(summary);

  callback(true);
}

var final = oboe( fs.createReadStream(  __dirname + '/testData - Start.json' ) )
  .on('node', {
        'server-timestamp': function(sts){
          //console.log('Time ' + sts);
          curentTimeStamp = sts;
        },
        '{aggregateSentiment keyphrases}': function(analysis){
          var result = buildData(analysis.keyphrases, analysis.aggregateSentiment, function(result) {
            console.log('callback');
          });
           //console.log(analysis);
           return result;
        }
     })
     .on('done', function(event){
        //console.log("---------- event: ---------------------------------------------");
        //console.dir(event);
        return oboe.drop;
     })
     .on('fail', function(e){
        console.log("Errors");
        console.error(e);
     });



console.log('======== DONE: final drop: ==============================================');
console.dir(final);
