// DoodleDash - Drawing and guessing game
// Developed by Fahad Khan (cybe4sent1nel)
// A fun multiplayer drawing experience
package version

import (
	"regexp"
)

// Version of the application.
var (
	Version = "1.0.0-doodledash"
	Commit  = ""
)

func init() {
	// We expect to get a "dirt git tag" when deploying a test version that
	// we did not yet finalize. We'll take it apart to allow the frontend
	// to put the correct link to the repository.

	if Version != "dev" {
		// version-commit_count_after_version-hash
		hashRegex := regexp.MustCompile(`v.+?(?:-\d+?-g(.+?)(?:$|-))`)
		match := hashRegex.FindStringSubmatch(Version)
		if len(match) == 2 {
			Commit = match[1]
		}
	}
}

