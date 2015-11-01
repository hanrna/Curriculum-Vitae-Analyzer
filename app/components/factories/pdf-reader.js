'use strict';

angular.module('myApp.factories')

.factory('pdfReader', function($q) {
    var getAllTextFromPdf = function(pdfDataUrl) {

// http://stackoverflow.com/questions/12092633/pdf-js-rendering-a-pdf-file-using-a-base64-file-source-instead-of-url
      var BASE64_MARKER = ';base64,';
      function convertDataURIToBinary(dataURI) {
        var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
        var base64 = dataURI.substring(base64Index);
        var raw = window.atob(base64);
        var rawLength = raw.length;
        var array = new Uint8Array(new ArrayBuffer(rawLength));

        for(var i = 0; i < rawLength; i++) {
          array[i] = raw.charCodeAt(i);
        }
        return array;
      }
      var pdfAsArray = convertDataURIToBinary(pdfDataUrl);


      return PDFJS.getDocument(pdfAsArray).then(function(pdf) {
        var allTextFromPdf = [];
        var numPages = pdf.pdfInfo.numPages;
        var promises = [];
        //console.log("pages", numPages);
        for (var i = 1; i <= numPages; i++) {
          promises.push(getTextFromPdfPage(i, pdf).then(function(textFromPdfPage) {
            return textFromPdfPage;
          })); // push the Promises to our array
        }
        return $q.all(promises).then(function(allPromiseResults) {
          allPromiseResults.forEach(function(textFromPdfPage) {
            Array.prototype.push.apply(allTextFromPdf, textFromPdfPage);
          });
          return allTextFromPdf;
        });
      });
    };

    var getTextFromPdfPage = function(pageNumber, pdf) {
      return pdf.getPage(pageNumber).then(function(page) {
        return page.getTextContent().then(function(textContent) {
          function isLowerCase(str) {
            return str === str.toLowerCase();
          }

          function repairPdfTextFormatting(textContent) {
            var repairedTextContent = [];
            for(var i = 0; i < textContent.items.length; i++) {
              var currentElement = textContent.items[i].str;
              if (currentElement == String.fromCharCode(160)) { // TODO: factor as global const
                // Non-breakable space is char 160. Fixes PDFs exported from Google Docs
                currentElement = " ";
                repairedTextContent.push(currentElement);
              } else if (isLowerCase(currentElement.slice(0, 1))) {
                // If it starts with lowercase letter, append it to the end of the previous line
                // Fixes things like ["Work experi", "e", "n", "ce"]
                repairedTextContent[repairedTextContent.length - 1] += currentElement;
              } else {
                repairedTextContent.push(currentElement);
              }
            }
            return repairedTextContent;
          }
          return repairPdfTextFormatting(textContent);
        });
      });
    };

    return {
      getAllTextFromPdf: getAllTextFromPdf
    };
});