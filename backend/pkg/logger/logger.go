package logger

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var Log *zap.SugaredLogger

// Init initializes the structured logger
func Init(mode string) {
	var config zap.Config

	if mode == "release" {
		config = zap.NewProductionConfig()
		config.EncoderConfig.TimeKey = "timestamp"
		config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
		config.OutputPaths = []string{"stdout"}
	} else {
		config = zap.NewDevelopmentConfig()
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	config.EncoderConfig.CallerKey = "caller"
	config.EncoderConfig.StacktraceKey = ""

	logger, err := config.Build(zap.AddCallerSkip(1))
	if err != nil {
		// Fallback: create a simple logger
		logger, _ = zap.NewProduction()
	}

	Log = logger.Sugar()
}

// Cleanup flushes any buffered log entries
func Cleanup() {
	if Log != nil {
		_ = Log.Sync()
	}
}

func Info(msg string, keysAndValues ...interface{}) {
	Log.Infow(msg, keysAndValues...)
}

func Error(msg string, keysAndValues ...interface{}) {
	Log.Errorw(msg, keysAndValues...)
}

func Warn(msg string, keysAndValues ...interface{}) {
	Log.Warnw(msg, keysAndValues...)
}

func Debug(msg string, keysAndValues ...interface{}) {
	Log.Debugw(msg, keysAndValues...)
}

func Fatal(msg string, keysAndValues ...interface{}) {
	Log.Fatalw(msg, keysAndValues...)
	os.Exit(1)
}
