'use strict';

angular.module('myApp.factories')

    .factory('lemma', function (nlp, parserUtils) {

        //returns an array of result objects with institute, course, degree, date and grade fields
        var parseEducationBackground = function (sentenceArray) {
            var result = new CVEducation();
            result.degree = getDegree(sentenceArray);
            //console.log("degree parsed", result.degree);
            result.keywords = getNamedEntities(sentenceArray);
            //console.log("keywords parsed", result.keywords);
            return result;
        }

        var getDegree = function(sentenceArray) {
            //for categorising degree
            var allDegreeKeyWordsArray = [phdKeyWords, masterKeyWords, bachelorKeyWords, diplomaKeyWords];
            var result = 0;
            //takes in an array of keywords in degree
            //return to see what degree it is
            //not found: 0, diploma: 1, bachelor: 2, master: 3, phd: 4
            var categoriseDegree = function (keywords) {
                for (var i = 0; i < allDegreeKeyWordsArray.length; i++) {
                    var degreeKeyWords = allDegreeKeyWordsArray[i];
                    for (var j = 0; j < degreeKeyWords.length; j++) {
                        if (keywords.toLowerCase().indexOf(degreeKeyWords[j]) > -1) {
                            //we found keyword, return integer representing degree
                            return allDegreeKeyWordsArray.length - i;
                        }
                    }
                }
                //not found, return 0
                return 0;
            }
            //find degree
            sentenceArray.forEach(function (sentence) {
                //find degree
                var degree = categoriseDegree(sentence);
                //update degree if it is larger
                if (degree > result) {
                    result = degree;
                }
            });
            return result;
        }


        //get keywords
        //returns the keywords with its corresponding number of occurrences
        var getNamedEntities = function(sentenceArray) {
            var keyWordNames = [];
            sentenceArray.forEach(
                function (sentence) {
                    var tokens = nlp.spot(sentence);
                    var singularisedTokens = tokens.map(function(token) {
                        return token.analysis.singularize();
                    });
                    Array.prototype.push.apply(keyWordNames,singularisedTokens);
                    //because nlp library will not pick up the word research, which is quite important
                    if (sentence.toLowerCase().indexOf("research") >= 0) {
                        keyWordNames.push("research");
                    }
                }
            )
            keyWordNames = keyWordNames.join(" ").split(/\/|\s/);
            return keyWordNames.filter(function(name) {
                return excludedKeyWords.indexOf(name) < 0;
            });
        }

        //split by sentences, then commas within each sentence
        //used for parsing of Skills too
        var parseInterestsAndSkills = function(sentenceArray) {
            var keyWords = [];
            sentenceArray.forEach(
                function (sentence) {
                    var tokens = sentence.split(",");
                    keyWords = keyWords.concat(tokens.map(Function.prototype.call, String.prototype.trim));
                }
            )
            return keyWords.map(function(keyword) {
                return keyword.toLowerCase();
            });
        }

        //returns all the sentence splitted up by " "
        var parseLanguages = function (sentenceArray) {
            return parserUtils.parse_language(sentenceArray);
        }

        var parseWorkTime = function (sentenceArray) {
            var totalWorkExperience = 0;
            //console.log("worktime", sentenceArray);
            sentenceArray.forEach(
                function (sentence) {
                    //matches January 2000 - present or January 2000 - February 2002
                    //note: first value is entire match, access from second onwards
                    var durationTokens = sentence.match(/([A-z]\w+)\s*(\d+)\s*(?:-)\s*([A-z]\w+)\s*(\d*)/);
                    //console.log("tokens", durationTokens);
                    //parse first 2 dates first
                    if (durationTokens != null && durationTokens.length >= 4) {
                        var startMonth = durationTokens[1];
                        var startYear = durationTokens[2];
                        var startDate = new Date("1 " + startMonth + " " + startYear);
                        var endDate;
                        if (durationTokens[3].toLowerCase() === "present") {
                                endDate = new Date();
                        } else if (durationTokens.length >= 5) {
                            //durationTokens >= 5
                            var endMonth = durationTokens[3];
                            var endYear = durationTokens[4];
                            endDate = new Date("1 " + endMonth + " " + endYear);
                        } else {
                            //invalid date
                            return;
                        }
                        //if either start or end date are invalid
                        if(isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                            return;
                        } else {
                            var timeDiff = endDate.getTime() - startDate.getTime();
                            totalWorkExperience += timeDiff;
                        }
                    }
                }
            )
            return totalWorkExperience;

        }

        //var test = ["National University of Singapore", "MSCS, IT, 2010 - 2012"];
        //console.log(parseEducationBackground(test));
        return {
            find_and_parse_education: parseEducationBackground,
            parse_language: parseLanguages,
            parse_interest: parseInterestsAndSkills,
            parse_skills: parseInterestsAndSkills,
            parse_experience: getNamedEntities,
            find_and_parse_work_time: parseWorkTime
        }
    }
)
;