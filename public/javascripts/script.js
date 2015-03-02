var app = angular.module('pelias', []);

app.run(function($rootScope) {});

app.controller('SearchController', function($scope, $rootScope, $sce, $http) {
  
  $scope.search = '';
  $scope.searchresults = [];
  $scope.searchType = 'fine';
  $scope.api_url = '//pelias.mapzen.com';
  $scope.resultsSelected = 0;
  $scope.button = {
    class: 'hidden',
    text: ''
  }

  var highlight = function( text, focus ){
    var r = RegExp( '('+ focus + ')', 'gi' );
    return text.replace( r, '<strong>$1</strong>' );
  }

  var getResults = function(url, resultkey) {
    var params = {
      input: $scope.search,
      // datasets: $scope.queryDatasets.join(','),
      size: 10
    }
    
    $http({
      url: $scope.api_url+url,
      method: 'GET',
      params: params,
      headers: { 'Accept': 'application/json' }
    }).success(function (data, status, headers, config) {
      if( data ){
        $scope[resultkey].length = 0;
        $scope.resultsSelected = 0;
        $scope[resultkey] = data.features.map( function( res ){
          res.htmltext = $sce.trustAsHtml(highlight( res.properties.text, $scope.search ));
          res.icon = 'unchecked';
          res.type = res.properties.type;
          return res;
        });
        $scope.button.class = 'btn-danger';
        $scope.button.text  = 'Not Found';
      }
      else {
        $scope[resultkey] = [];
      }
    }).error(function (data, status, headers, config) {
      $scope[resultkey] = [];
    });
  };

  $scope.selectResult = function( result, changeQuery ){
    if (result.icon === 'unchecked') {
      $scope.resultsSelected++;
      result.icon = 'check';
    } else {
      $scope.resultsSelected--;
      result.icon = 'unchecked';
    }
    if ($scope.resultsSelected > 0) {
      $scope.button.class = 'btn-success';
      $scope.button.text  = 'Done';  
    } else {
      $scope.button.class = 'btn-danger';
      $scope.button.text  = 'Not Found';
    }
    
  }

  $rootScope.$on( 'hideall', function( ev ){
    $scope.searchresults = []
  });

  $rootScope.$on( 'hidesearch', function( ev ){
    $scope.searchresults = [];
  });

  $scope.keyPressed = function(ev) {
    if (ev.which == 13) {
      $scope.fullTextSearch();
    } 
  }

  $scope.onFocus = function(ev) {
    // $("#searchresults").removeClass("smaller");
  }

  $scope.onBlur = function(ev) {
    // $("#searchresults").addClass("smaller");
  }

  $scope.fullTextSearch = function(){
    var url = $scope.searchType.toLowerCase() === 'fine' ? '/search' : '/search/coarse';
    getResults(url, 'searchresults');
  }

})
