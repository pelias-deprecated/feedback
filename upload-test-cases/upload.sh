git clone git@github.com:pelias/acceptance-tests
node generate_tests.js acceptance-tests/test_cases/search.json
cd acceptance-tests
branchName="feedback_$(date -I)"
git checkout -b $branchName
git add test_cases/search.json
git commit -m "Feedback app test-cases for $(date -I)."
git push --set-upstream origin $branchName
# curl -X POST -H "Content-Type: application/json" -d '{
  # "title": "Feedback App test cases for $(date -I )",
  # "body": "",
  # "head": "$branchName",
  # "base": "master"
# }' ssh://git@api.github.com:repos/pelias/acceptance-tests/pulls
cd ..
rm -rf acceptance-tests
