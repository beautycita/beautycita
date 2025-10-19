#!/bin/bash

# BeautyCita RASA Training Script
# Trains the RASA model with proper error handling and validation

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RASA_DIR="$(dirname "$SCRIPT_DIR")"
VENV_PATH="$RASA_DIR/venv"
MODEL_DIR="$RASA_DIR/models"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if virtual environment exists
    if [ ! -d "$VENV_PATH" ]; then
        log_error "Virtual environment not found at $VENV_PATH"
        log_error "Please run setup.sh first"
        exit 1
    fi

    # Check if RASA is installed
    if ! "$VENV_PATH/bin/python" -c "import rasa" &> /dev/null; then
        log_error "RASA is not installed in the virtual environment"
        exit 1
    fi

    # Check if required files exist
    local required_files=("$RASA_DIR/domain.yml" "$RASA_DIR/config.yml" "$RASA_DIR/data/nlu.yml" "$RASA_DIR/data/stories.yml")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Required file not found: $file"
            exit 1
        fi
    done

    log_info "Prerequisites check passed"
}

# Function to validate training data
validate_data() {
    log_info "Validating training data..."

    cd "$RASA_DIR"
    source "$VENV_PATH/bin/activate"

    if ! rasa data validate; then
        log_error "Training data validation failed"
        exit 1
    fi

    log_info "Training data validation passed"
}

# Function to train the model
train_model() {
    log_info "Starting RASA model training..."

    cd "$RASA_DIR"
    source "$VENV_PATH/bin/activate"

    # Create models directory if it doesn't exist
    mkdir -p "$MODEL_DIR"

    # Train the model with detailed logging
    if rasa train --data data --config config.yml --domain domain.yml --out models --verbose; then
        log_info "Model training completed successfully"

        # Find the latest model
        latest_model=$(ls -t "$MODEL_DIR"/*.tar.gz 2>/dev/null | head -n1)
        if [ -n "$latest_model" ]; then
            log_info "Latest model: $(basename "$latest_model")"

            # Create a symlink to the latest model
            ln -sf "$(basename "$latest_model")" "$MODEL_DIR/latest.tar.gz"
            log_info "Created symlink to latest model"
        fi
    else
        log_error "Model training failed"
        exit 1
    fi
}

# Function to test the model
test_model() {
    log_info "Testing the trained model..."

    cd "$RASA_DIR"
    source "$VENV_PATH/bin/activate"

    # Run model tests
    if rasa test --stories data/stories.yml --model models/latest.tar.gz; then
        log_info "Model testing completed"
    else
        log_warning "Model testing encountered issues (this is not always critical)"
    fi
}

# Function to show training summary
show_summary() {
    log_info "Training Summary:"
    echo "=================="
    echo "RASA Directory: $RASA_DIR"
    echo "Models Directory: $MODEL_DIR"
    echo "Latest Model: $(ls -t "$MODEL_DIR"/*.tar.gz 2>/dev/null | head -n1 | xargs basename 2>/dev/null || echo 'None')"
    echo "Model Count: $(ls "$MODEL_DIR"/*.tar.gz 2>/dev/null | wc -l)"
    echo ""
    echo "To start the RASA server:"
    echo "  cd $RASA_DIR"
    echo "  source venv/bin/activate"
    echo "  rasa run --enable-api --cors '*' --port 5005"
    echo ""
    echo "To start the actions server:"
    echo "  cd $RASA_DIR"
    echo "  source venv/bin/activate"
    echo "  rasa run actions --port 5055"
}

# Main execution
main() {
    log_info "BeautyCita RASA Training Script"
    log_info "==============================="

    check_prerequisites
    validate_data
    train_model

    # Optional: Run tests if --test flag is provided
    if [ "$1" = "--test" ]; then
        test_model
    fi

    show_summary
    log_info "Training process completed successfully!"
}

# Run main function with all arguments
main "$@"