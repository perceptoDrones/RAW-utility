# Directories: 
PROJECT_DIR = .
BUILD_DIR   = $(PROJECT_DIR)/build
SRC_DIR     = $(PROJECT_DIR)/src

# Compiler: 
CC = g++

# Compiler flags: 
DEP_FLAGS = -MMD -MP -MT
CFLAGS    = -O3 `pkg-config --cflags opencv`

# Required libs: 
LIBS = `pkg-config --libs opencv` -lstdc++

# Include directories list: 
INCLUDE_DIRS = `find -L $(SRC_DIR) -type d | sed 's/^/-I/'`

.PHONY: all yuv_util clean

all: yuv_util

yuv_util: 
	@echo "\n\033[1;34mCompiling & linking $@: \033[0m"
	$(CC) $(CFLAGS) $(OBJECTS) $(SRC_DIR)/main.cpp $(INCLUDE_DIRS) -o $(BUILD_DIR)/yuv_util $(LIBS)
	@echo "\033[1;32mCompilation successful. \033[0m"

clean: 
	@echo "\n\033[1;34mRemoving all build files: \033[0m"
	rm -rf $(BUILD_DIR)/*
	@echo "\033[0;32mDone. \033[0m"
