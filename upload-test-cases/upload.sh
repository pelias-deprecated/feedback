# A shell script that extracts new test-cases from the feedback app's MongoDB
# collection, adds them to pelias/fuzzy-tests's test-cases in a new
# branch, and opens a pull request in that repository.

api_key=$1
user=$2
delay_before_pull=${3:-3}

if [ -z $2 ]; then
	echo "Usage: $0 [api_key] [user] {delay_before_pull}"
	exit 1
else
	# Generate and add new test-cases.
	repo_dest=/tmp/fuzzy-tests
  if [ -d $repo_dest ]; then
    rm -rf $repo_dest
  fi

	git clone -q git@github.com:pelias/fuzzy-tests $repo_dest
	node generate_tests.js $repo_dest
	if [ $? -eq 0 ]; then
		cd $repo_dest

		# Checkout a branch, push the new test-cases.
		date="$(date +%Y-%m-%d-%H-%M-%S)"
		branchName="feedback_$date"
		git checkout -q -b $branchName
		git add test_cases/feedback_pass.json test_cases/feedback_fail.json
		git commit -q -m "Feedback app test-cases for $date."
		git push -q --set-upstream origin $branchName

	# sleep before submitting our pull
	sleep $delay_before_pull

		# Open a pull request for the new branch.
		curl --silent --show-error -X POST -H "Content-Type: application/json" \
			--user $user:$api_key -d '{
				"title": "feedback app test cases for '$date'",
				"body": "",
				"head": "feedback_'$date'",
				"base": "master"
			}' https://api.github.com/repos/pelias/fuzzy-tests/pulls

		cd ..
	fi
fi
rm -rf $repo_dest
