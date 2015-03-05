# A shell script that extracts new test-cases from the feedback app's MongoDB
# collection, adds them to pelias/acceptance-tests's test-cases in a new
# branch, and opens a pull request in that repository.

api_key="$1"
if [ "$api_key" = "" ]; then
	>&2 echo "No GitHub API key argument provided. Exiting."
else
	# Generate and add new test-cases.
	repo_dest=/tmp/acceptance-tests
	git clone -q git@github.com:pelias/acceptance-tests $repo_dest
	node generate_tests.js $repo_dest/test_cases/search.json
	cd $repo_dest

	# Checkout a branch, push the new test-cases.
	date="$(date -I)"
	branchName="feedback_$date"
	git checkout -q -b $branchName
	git add test_cases/search.json
	git commit -q -m "Feedback app test-cases for $date."
	git push -q --set-upstream origin $branchName

	# Open a pull request for the new branch.
	curl --silent --show-error -X POST -H "Content-Type: application/json" \
		--user sevko:$api_key -d '{
			"title": "feedback app test cases for '$date'",
			"body": "",
			"head": "feedback_'$date'",
			"base": "master"
		}' https://api.github.com/repos/pelias/acceptance-tests/pulls

	cd ..
	rm -rf $repo_dest
fi
