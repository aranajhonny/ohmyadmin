package router

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/aranajhonny/ohmyadmin/backend/internal/api"
	"github.com/aranajhonny/ohmyadmin/backend/internal/auth"
)

func New(authService *auth.Service, corsCfg cors.Options) http.Handler {
	r := chi.NewRouter()

	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.Timeout(60 * time.Second))

	r.Use(cors.Handler(corsCfg))

	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			start := time.Now()
			next.ServeHTTP(w, r)
			slog.Debug("request",
				"method", r.Method,
				"path", r.URL.Path,
				"duration", time.Since(start),
			)
		})
	})

	authHandler := api.NewAuthHandler(authService)
	dbHandler := api.NewDatabaseHandler()
	tableHandler := api.NewTableHandler()
	sqlHandler := api.NewSQLHandler()
	exportHandler := api.NewExportHandler()
	importHandler := api.NewImportHandler()
	serverHandler := api.NewServerExtendedHandler()
	triggersHandler := api.NewTriggersHandler()
	routinesHandler := api.NewRoutinesHandler()
	eventsHandler := api.NewEventsHandler()
	viewsHandler := api.NewViewsHandler()
	foreignKeysHandler := api.NewForeignKeysHandler()
	usersHandler := api.NewUsersHandler()

	r.Route("/api", func(r chi.Router) {

		r.Get("/health", api.HealthCheck)

		r.Post("/auth/login", authHandler.Login)

		r.Group(func(r chi.Router) {
			r.Use(authService.Middleware)

			r.Get("/auth/status", authHandler.Status)
			r.Post("/auth/logout", authHandler.Logout)

			r.Get("/server/info", api.GetServerInfo)
			r.Get("/server/variables", serverHandler.GetVariables)
			r.Get("/server/status", serverHandler.GetStatus)
			r.Get("/server/processlist", serverHandler.GetProcessList)
			r.Get("/server/privileges", serverHandler.GetPrivileges)

			r.Get("/databases", dbHandler.List)
			r.Post("/databases", dbHandler.Create)
			r.Delete("/databases/{name}", dbHandler.Drop)

			r.Get("/databases/{db}/tables", tableHandler.List)
			r.Post("/databases/{db}/tables", tableHandler.Create)
			r.Post("/databases/{db}/tables/structured", tableHandler.CreateTableStructured)
			r.Get("/databases/{db}/tables/{table}", tableHandler.Info)
			r.Delete("/databases/{db}/tables/{table}", tableHandler.Drop)
			r.Put("/databases/{db}/tables/{table}/rename", tableHandler.RenameTable)
			r.Post("/databases/{db}/tables/{table}/truncate", tableHandler.TruncateTable)
			r.Get("/databases/{db}/tables/{table}/columns", tableHandler.Columns)
			r.Post("/databases/{db}/tables/{table}/columns", tableHandler.AddColumn)
			r.Delete("/databases/{db}/tables/{table}/columns/{column}", tableHandler.DropColumn)
			r.Put("/databases/{db}/tables/{table}/columns/{column}", tableHandler.AlterColumn)
			r.Get("/databases/{db}/tables/{table}/indexes", tableHandler.Indexes)
			r.Post("/databases/{db}/tables/{table}/indexes", tableHandler.AddIndex)
			r.Delete("/databases/{db}/tables/{table}/indexes/{index}", tableHandler.DropIndex)
			r.Post("/databases/{db}/tables/{table}/structure", tableHandler.AlterStructure)
			r.Get("/databases/{db}/tables/{table}/data", tableHandler.Data)
			r.Post("/databases/{db}/tables/{table}/data", tableHandler.InsertRow)
			r.Put("/databases/{db}/tables/{table}/data", tableHandler.UpdateRow)
			r.Delete("/databases/{db}/tables/{table}/data", tableHandler.DeleteRow)

			r.Get("/export/{db}", exportHandler.Export)
			r.Get("/export/{db}/{table}", exportHandler.Export)
			r.Post("/import/{db}", importHandler.Import)
			r.Post("/import/{db}/{table}", importHandler.Import)
			r.Post("/import/database", importHandler.ImportDatabase)

			r.Post("/sql/execute", sqlHandler.Execute)
r.Post("/sql/format", sqlHandler.Format)
r.Get("/sql/auto-complete", sqlHandler.AutoComplete)

r.Get("/triggers", triggersHandler.List)
r.Post("/triggers", triggersHandler.Create)
r.Delete("/triggers", triggersHandler.Drop)

r.Get("/routines", routinesHandler.List)
r.Post("/routines", routinesHandler.Create)
r.Delete("/routines", routinesHandler.Drop)

r.Get("/events", eventsHandler.List)
r.Post("/events", eventsHandler.Create)
r.Delete("/events", eventsHandler.Drop)

viewsHandler.RegisterRoutes(r)
foreignKeysHandler.RegisterRoutes(r)
usersHandler.RegisterRoutes(r)
		})
	})

	return r
}
