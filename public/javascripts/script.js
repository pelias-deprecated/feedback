var app = angular.module('pelias', []);

app.run(function($rootScope) {});

app.controller('SearchController', function($scope, $rootScope, $sce, $http) {
  
  $scope.search = '';
  $scope.searchresults = [];
  $scope.searchType = 'fine';
  $scope.api_url = '//pelias.mapzen.com';

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
        $scope[resultkey] = data.features.map( function( res ){
          res.htmltext = $sce.trustAsHtml(highlight( res.properties.text, $scope.search ));
          res.icon = 'unchecked';
          res.type = res.properties.type;
          return res;
        });
      }
      else {
        $scope[resultkey] = [];
      }
    }).error(function (data, status, headers, config) {
      $scope[resultkey] = [];
    });
  };

  $scope.selectResult = function( result, changeQuery ){
    result.icon = result.icon === 'unchecked' ? 'check' : 'unchecked';
  }

  $rootScope.$on( 'hideall', function( ev ){
    $scope.suggestresults = [];
    $scope.searchresults = []
  });

  $rootScope.$on( 'hidesuggest', function( ev ){
    $scope.suggestresults = [];
  });

  $rootScope.$on( 'hidesearch', function( ev ){
    $scope.searchresults = [];
  });

  $scope.keyPressed = function(ev) {
    if (ev.which == 13) {
      $("#suggestresults").addClass("smaller");
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

    if( !$scope.search.length ) {
      $rootScope.$emit( 'hideall' );
      return;
    }
    $rootScope.$emit('fullTextSearch', $scope.search, $scope.searchType, $scope.geobias);

    var url = $scope.searchType.toLowerCase() === 'fine' ? '/search' : '/search/coarse';
    getResults(url, 'searchresults');
  }

})
