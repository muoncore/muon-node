var oboe = require('oboe');
var fs = require('fs');

var counter = 0;
var curentTimeStamp = null;
var summary = {};

function buildData( keywords, sentiment) {

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

    }
    else {
      //Create keyword object
      summary[thisDate][keywords[i].phrase] = { "keyphrase": keywords[i].phrase, "count": 1, "min_sentiment": sentiment, "average_sentiment": sentiment, "max_sentiment": sentiment, "normalised_sentiment": sentiment};
    }

    //console.log(summary);

    //Output data
    //console.log(thisDate + ': ' + keywords[i].phrase + " " + keywords[i].count + " " + sentiment);
    //console.log(keywords[i].phrase);

  }
  
  console.log(summary);

  return true;
}



oboe( fs.createReadStream(  __dirname + '/testData - Start.json' ) )
  .on('node', {
        'server-timestamp': function(sts){
          //console.log('Time ' + sts);
          curentTimeStamp = sts;
        },
        '{aggregateSentiment keyphrases}': function(analysis){
           buildData(analysis.keyphrases, analysis.aggregateSentiment);
           //console.log(analysis);
        }
     })
     .on('done', function(){
        //console.log("---------------------");
        return oboe.drop;
     })
     .on('fail', function(e){
        console.log("Errors");
        console.error(e);
     });
