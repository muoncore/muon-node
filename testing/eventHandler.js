module.exports = eventHandler;

function normalise(min, max, value){
  var maxOutValue = 100,
      minOutValue = 0;

  if (arguments.length == 1) {
    return maxOutValue;
  }
  return minOutValue + (value - min) * maxOutValue / (max - min);
}

function eventHandler(state, event) {

  var keywords = event.payload.textanalysis.keyphrases;
  var currentTimeStamp = event["server-timestamp"];
  var sentiment = event.payload.textanalysis.aggregateSentiment;

  //Build Date
  var myDate = new Date(currentTimeStamp);
  var dd = myDate.getDate().toString();
  var mm = (myDate.getMonth()+1).toString();
  var yyyy = myDate.getFullYear().toString();

  var thisDate = yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]);

  //Create date structure
  if (!(thisDate in state)) {
      //No date object, so create date object
      state[thisDate] = {};
  }

  keywords.forEach(function(keyword) {

    //Check for keyword
    if (keyword.phrase in state[thisDate]) {

      //Increment count
      state[thisDate][keyword.phrase].count += keyword.count;

      // Add new sentiment
      state[thisDate][keyword.phrase].cumulative_sentiment += sentiment;

      //Update mean Average
      state[thisDate][keyword.phrase].average_sentiment = (state[thisDate][keyword.phrase].cumulative_sentiment / state[thisDate][keyword.phrase].count);

      //Update min_sentiment
      if ( (state[thisDate][keyword.phrase].min_sentiment) > sentiment ) {
        state[thisDate][keyword.phrase].min_sentiment = sentiment;
      }

      //Update max_sentiment
      if ( (state[thisDate][keyword.phrase].max_sentiment) < sentiment ) {
        state[thisDate][keyword.phrase].max_sentiment = sentiment;
      }

      //Update normalised sentiment
      state[thisDate][keyword.phrase].normalised_sentiment = normalise(state[thisDate][keyword.phrase].min_sentiment,
                                                                       state[thisDate][keyword.phrase].max_sentiment,
                                                                       state[thisDate][keyword.phrase].average_sentiment);

    }
    else {
      //Create keyword object
      state[thisDate][keyword.phrase] = {
        "keyphrase": keyword.phrase,
        "count": 1,
        "cumulative_sentiment": sentiment,
        "min_sentiment": sentiment,
        "average_sentiment": sentiment,
        "max_sentiment": sentiment,
        "normalised_sentiment": normalise(sentiment)
      };
    }

  });

  return (JSON.stringify(state));

}


/* test */

console.log( eventHandler({ '20150101':
   { inofficiousness:
      { keyphrase: 'inofficiousness',
        count: 1,
        cumulative_sentiment: 10,
        min_sentiment: 10,
        average_sentiment: 10,
        max_sentiment: 10,
        normalised_sentiment: 10 },
     starkly:
      { keyphrase: 'starkly',
        count: 1,
        cumulative_sentiment: 10,
        min_sentiment: 10,
        average_sentiment: 10,
        max_sentiment: 10,
        normalised_sentiment: 10 },
     cataphrygian:
      { keyphrase: 'cataphrygian',
        count: 1,
        cumulative_sentiment: 10,
        min_sentiment: 10,
        average_sentiment: 10,
        max_sentiment: 10,
        normalised_sentiment: 10 },
     adequation:
      { keyphrase: 'adequation',
        count: 1,
        cumulative_sentiment: 10,
        min_sentiment: 10,
        average_sentiment: 10,
        max_sentiment: 10,
        normalised_sentiment: 10 },
     foreintend:
      { keyphrase: 'foreintend',
        count: 1,
        cumulative_sentiment: 10,
        min_sentiment: 10,
        average_sentiment: 10,
        max_sentiment: 10,
        normalised_sentiment: 10 },
     interrupt:
      { keyphrase: 'interrupt',
        count: 1,
        cumulative_sentiment: 10,
        min_sentiment: 10,
        average_sentiment: 10,
        max_sentiment: 10,
        normalised_sentiment: 10 },
     coproduce:
      { keyphrase: 'coproduce',
        count: 1,
        cumulative_sentiment: 10,
        min_sentiment: 10,
        average_sentiment: 10,
        max_sentiment: 10,
        normalised_sentiment: 10 },
     bovine:
      { keyphrase: 'bovine',
        count: 1,
        cumulative_sentiment: 10,
        min_sentiment: 10,
        average_sentiment: 10,
        max_sentiment: 10,
        normalised_sentiment: 10 },
     vitrage:
      { keyphrase: 'vitrage',
        count: 1,
        cumulative_sentiment: 10,
        min_sentiment: 10,
        average_sentiment: 10,
        max_sentiment: 10,
        normalised_sentiment: 10 },
     undisputatious:
      { keyphrase: 'undisputatious',
        count: 1,
        cumulative_sentiment: 10,
        min_sentiment: 10,
        average_sentiment: 10,
        max_sentiment: 10,
        normalised_sentiment: 10 }
    }
},
{
    "service-id": "muon://chatter",
    "local-id": "019ef59c-dfb5-404c-8202-6574c42baa0f",
    "payload": {
        "id": "19c4ec3b-cafb-4f81-ac50-88d57478bbb0",
        "text": "bovine starkly cataphrygian vitrage starkly coproduce adequation interrupt foreintend inofficiousness undisputatious",
        "textanalysis": {
            "aggregateSentiment": 53,
            "keyphrases": [
                {
                    "phrase": "inofficiousness",
                    "count": 1
                },
                {
                    "phrase": "starkly",
                    "count": 2
                },
                {
                    "phrase": "cataphrygian",
                    "count": 1
                },
                {
                    "phrase": "adequation",
                    "count": 1
                },
                {
                    "phrase": "foreintend",
                    "count": 1
                },
                {
                    "phrase": "interrupt",
                    "count": 1
                },
                {
                    "phrase": "coproduce",
                    "count": 1
                },
                {
                    "phrase": "bovine",
                    "count": 1
                },
                {
                    "phrase": "vitrage",
                    "count": 1
                },
                {
                    "phrase": "undisputatious",
                    "count": 1
                },
                {
                    "phrase": "aattaattataatatt",
                    "count": 1
                }
            ]
        }
    },
    "stream-name": "chatter",
    "server-timestamp": 1420070400000
}) );

//*/
