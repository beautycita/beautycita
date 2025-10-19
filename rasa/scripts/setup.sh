#!/bin/bash

# BeautyCita RASA Setup Script
# Sets up the complete RASA environment with proper permissions and dependencies

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RASA_DIR="$(dirname "$SCRIPT_DIR")"
VENV_PATH="$RASA_DIR/venv"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Function to check system requirements
check_system_requirements() {
    log_step "Checking system requirements..."

    # Check Python version
    if ! command -v python3.10 &> /dev/null; then
        log_error "Python 3.10 is required but not found"
        log_error "Please install Python 3.10 first"
        exit 1
    fi

    # Check if we have the required packages
    if ! dpkg -l | grep -q python3.10-venv; then
        log_error "python3.10-venv package is required"
        log_error "Please install it: sudo apt install python3.10-venv"
        exit 1
    fi

    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        log_warning "PostgreSQL client not found, some features may not work"
    fi

    log_info "System requirements check passed"
}

# Function to create virtual environment
setup_virtual_environment() {
    log_step "Setting up Python virtual environment..."

    if [ -d "$VENV_PATH" ]; then
        log_warning "Virtual environment already exists at $VENV_PATH"
        read -p "Do you want to recreate it? [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$VENV_PATH"
        else
            log_info "Using existing virtual environment"
            return 0
        fi
    fi

    # Create virtual environment
    python3.10 -m venv "$VENV_PATH"

    # Activate and upgrade pip
    source "$VENV_PATH/bin/activate"
    pip install --upgrade pip

    log_info "Virtual environment created successfully"
}

# Function to install RASA and dependencies
install_dependencies() {
    log_step "Installing RASA and dependencies..."

    cd "$RASA_DIR"
    source "$VENV_PATH/bin/activate"

    # Install RASA with spaCy support
    pip install rasa[spacy]==3.6.21

    # Install additional dependencies
    pip install -r requirements.txt

    # Download spaCy language model
    python -m spacy download es_core_news_sm

    # Install API dependencies
    if [ -f "api/requirements.txt" ]; then
        pip install -r api/requirements.txt
    fi

    log_info "Dependencies installed successfully"
}

# Function to setup database
setup_database() {
    log_step "Setting up RASA database..."

    # Check if PostgreSQL is accessible
    if command -v psql &> /dev/null; then
        log_info "PostgreSQL found, setting up database..."

        # Check if database exists and create if needed
        if ! PGPASSWORD=postgres psql -U postgres -h localhost -lqt | cut -d \| -f 1 | grep -qw beautycita_rasa; then
            log_info "Creating RASA database..."
            PGPASSWORD=postgres createdb -U postgres -h localhost beautycita_rasa
        else
            log_info "RASA database already exists"
        fi

        # Run database setup script
        if [ -f "$RASA_DIR/config/database_setup.sql" ]; then
            log_info "Setting up database schema..."
            PGPASSWORD=secure_rasa_password_2025 psql -U rasa_user -h localhost -d beautycita_rasa -f "$RASA_DIR/config/database_setup.sql" 2>/dev/null || {
                log_warning "Database schema setup failed (user might not exist yet)"
                log_warning "Please run the database setup manually as admin"
            }
        fi
    else
        log_warning "PostgreSQL not found, skipping database setup"
        log_warning "Please ensure PostgreSQL is installed and configured"
    fi
}

# Function to set up proper permissions
setup_permissions() {
    log_step "Setting up file permissions..."

    # Ensure www-data owns the RASA directory
    if [ "$(id -u)" = "0" ]; then
        # Running as root
        chown -R www-data:www-data "$RASA_DIR"
        chmod -R 755 "$RASA_DIR"
        chmod +x "$RASA_DIR/scripts"/*.sh
    else
        # Running as regular user
        log_warning "Not running as root, cannot set www-data ownership"
        log_warning "Please run 'sudo chown -R www-data:www-data $RASA_DIR' after setup"
        chmod +x "$RASA_DIR/scripts"/*.sh
    fi

    log_info "Permissions set successfully"
}

# Function to create systemd services
create_systemd_services() {
    log_step "Creating systemd service files..."

    # RASA Server Service
    cat > /tmp/beautycita-rasa.service << EOF
[Unit]
Description=BeautyCita RASA Server
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$RASA_DIR
Environment=PATH=$VENV_PATH/bin
ExecStart=$VENV_PATH/bin/rasa run --enable-api --cors "*" --port 5005
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # RASA Actions Service
    cat > /tmp/beautycita-rasa-actions.service << EOF
[Unit]
Description=BeautyCita RASA Actions Server
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$RASA_DIR
Environment=PATH=$VENV_PATH/bin
ExecStart=$VENV_PATH/bin/rasa run actions --port 5055
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # RASA API Service
    cat > /tmp/beautycita-rasa-api.service << EOF
[Unit]
Description=BeautyCita RASA API Gateway
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$RASA_DIR/api
Environment=PATH=$VENV_PATH/bin
Environment=FLASK_ENV=production
Environment=RASA_SERVER_URL=http://localhost:5005
Environment=RASA_ACTION_SERVER_URL=http://localhost:5055
ExecStart=$VENV_PATH/bin/gunicorn --bind 0.0.0.0:5000 --workers 2 app:create_app()
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    if [ "$(id -u)" = "0" ]; then
        # Move service files to systemd directory
        mv /tmp/beautycita-rasa*.service /etc/systemd/system/
        systemctl daemon-reload
        log_info "Systemd services created successfully"
        log_info "To enable services: sudo systemctl enable beautycita-rasa beautycita-rasa-actions beautycita-rasa-api"
        log_info "To start services: sudo systemctl start beautycita-rasa beautycita-rasa-actions beautycita-rasa-api"
    else
        log_warning "Not running as root, cannot install systemd services"
        log_warning "Service files created in /tmp/, please move them manually"
    fi
}

# Function to validate setup
validate_setup() {
    log_step "Validating setup..."

    cd "$RASA_DIR"
    source "$VENV_PATH/bin/activate"

    # Check RASA installation
    if rasa --version &> /dev/null; then
        log_info "RASA installation validated"
    else
        log_error "RASA installation validation failed"
        return 1
    fi

    # Check required files
    local required_files=("domain.yml" "config.yml" "data/nlu.yml" "data/stories.yml" "data/rules.yml")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Required file missing: $file"
            return 1
        fi
    done

    # Validate training data
    if rasa data validate; then
        log_info "Training data validation passed"
    else
        log_warning "Training data validation failed (this might be okay for initial setup)"
    fi

    log_info "Setup validation completed"
}

# Function to show setup summary
show_setup_summary() {
    log_info "Setup Summary:"
    echo "==============="
    echo "RASA Directory: $RASA_DIR"
    echo "Virtual Environment: $VENV_PATH"
    echo "Python Version: $(source "$VENV_PATH/bin/activate" && python --version)"
    echo "RASA Version: $(source "$VENV_PATH/bin/activate" && rasa --version 2>/dev/null || echo 'Error getting version')"
    echo ""
    echo "Next Steps:"
    echo "1. Train the model: cd $RASA_DIR && ./scripts/train.sh"
    echo "2. Start RASA server: cd $RASA_DIR && source venv/bin/activate && rasa run --enable-api --cors '*' --port 5005"
    echo "3. Start actions server: cd $RASA_DIR && source venv/bin/activate && rasa run actions --port 5055"
    echo "4. Start API gateway: cd $RASA_DIR/api && source ../venv/bin/activate && python app.py"
    echo ""
    echo "Or use systemd services (if created):"
    echo "  sudo systemctl start beautycita-rasa"
    echo "  sudo systemctl start beautycita-rasa-actions"
    echo "  sudo systemctl start beautycita-rasa-api"
}

# Main execution
main() {
    log_info "BeautyCita RASA Setup Script"
    log_info "============================"

    check_system_requirements
    setup_virtual_environment
    install_dependencies
    setup_database
    setup_permissions

    # Create systemd services only if requested
    if [ "$1" = "--systemd" ]; then
        create_systemd_services
    fi

    validate_setup
    show_setup_summary

    log_info "Setup completed successfully!"
    log_info "Run './scripts/train.sh' to train your first model"
}

# Run main function with all arguments
main "$@"