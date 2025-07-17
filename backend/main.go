package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/labstack/echo/v5" // Explicitly use Echo
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

// This is an old Pocketbase version (v0.22.27)
// The documentation for this has been moved to...
// https://pocketbase.io/old/
/* Upgrade to pocketbase v0.23.0 (Go):
https://pocketbase.io/v023upgrade/go/ */

func main() {
	app := pocketbase.New()

	// pb_hooks.Register(app)

	//middleware.Register(app)


	////////* Old serve solution that didnt work with page refresh *////////

	// // serves static files from the provided public dir (if exists)
    // app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
    //     e.Router.GET("/*", apis.StaticDirectoryHandler(os.DirFS("./pb_public"), false))

	// 	// Fixes email verification error that keeps trying to access local machine instead of public url.
	// 	app.Settings().Meta.AppUrl = "https://spaceship.fly.dev"
		
    //     return nil
    // })

	/////////////////////////////////////////////////////////////////////////

	// OnBeforeServe adds fallback routing for React.
	// I have no idea how this fallback works. It's ChatGPT generated.
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		publicDir := "./pb_public"

		// Custom handler for fallback logic
		e.Router.GET("/*", func(c echo.Context) error {
			// Resolve the requested file path
			requestedPath := filepath.Join(publicDir, c.Request().URL.Path)

			// Check if the file exists
			if _, err := os.Stat(requestedPath); os.IsNotExist(err) {
				// Fallback to index.html for unmatched routes
				indexPath := filepath.Join(publicDir, "index.html")
				return c.File(indexPath)
			}

			// Serve the requested file
			return c.File(requestedPath)
		})

		// Fix email verification error that keeps trying to access the local machine instead of public URL
		app.Settings().Meta.AppUrl = "https://goblin-writer.fly.dev"

		return nil
	})

	if err := app.Start(); err != nil {
        log.Fatal(err)
    }
}

