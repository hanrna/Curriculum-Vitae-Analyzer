'use strict';

angular.module('myApp.factories')
  .factory('results', function (cvEvaluator) {
    var EDU_WEIGHT = 0.20, ESS_SKILL_WEIGHT = 0.20, PREF_SKILL_WEIGHT = 0.20,
      EXP_WEIGHT = 0.20, LANG_WEIGHT = 0.20;

    function getResultsFromEvaluation() {
      // return names, score
      var evaluatedCvs = cvEvaluator.evaluateCV();
      return evaluatedCvs;
      evaluatedCvs.forEach(function(evaluatedCv) {

      });
    }

    // update weights
    function updateWeights(edu, essSkill, prefSkill, expe, lang) {
      var total = edu + essSkill + prefSkill + expe + lang;

      EDU_WEIGHT = edu/total;
      ESS_SKILL_WEIGHT = essSkill/total;
      PREF_SKILL_WEIGHT = prefSkill/total;
      EXP_WEIGHT = expe/total;
      LANG_WEIGHT = lang/total;
    }

    return {
      getResultsFromEvaluation: getResultsFromEvaluation,
      updateWeights: updateWeights
    }
  });