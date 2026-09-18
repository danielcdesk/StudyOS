use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use serde_json::{json, Value};
use std::{fs, path::{Path, PathBuf}};
use tauri::{AppHandle, Manager};

const MAX_STATE_BYTES: usize = 10 * 1024 * 1024;
const DATABASE_FILE: &str = "studyos.db";

fn app_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app.path().app_data_dir().map_err(|error| error.to_string())?;
    fs::create_dir_all(&directory).map_err(|error| format!("Não foi possível preparar a pasta de dados: {error}"))?;
    Ok(directory)
}

fn db_path(app: &AppHandle) -> Result<PathBuf, String> { Ok(app_dir(app)?.join(DATABASE_FILE)) }

fn backup_file(path: &Path, suffix: &str) -> Result<(), String> {
    if !path.exists() { return Ok(()); }
    let backups = path.parent().ok_or("Pasta de dados inválida")?.join("backups");
    fs::create_dir_all(&backups).map_err(|error| error.to_string())?;
    let stamp = Utc::now().format("%Y%m%d-%H%M%S-%3f");
    fs::copy(path, backups.join(format!("studyos-{stamp}-{suffix}"))).map_err(|error| error.to_string())?;
    Ok(())
}

fn open_database(app: &AppHandle) -> Result<Connection, String> {
    let path = db_path(app)?;
    let connection = Connection::open(path).map_err(|error| error.to_string())?;
    connection.pragma_update(None, "foreign_keys", "ON").map_err(|error| error.to_string())?;
    connection.execute_batch(
        "BEGIN;
         CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
         CREATE TABLE IF NOT EXISTS study_state (id INTEGER PRIMARY KEY CHECK(id = 1), payload TEXT NOT NULL, updated_at TEXT NOT NULL);
         INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (1, CURRENT_TIMESTAMP);
         COMMIT;"
    ).map_err(|error| format!("Não foi possível atualizar o banco local: {error}"))?;
    Ok(connection)
}

fn validate_state(value: &Value) -> Result<(), String> {
    let serialized = serde_json::to_vec(value).map_err(|error| error.to_string())?;
    if serialized.len() > MAX_STATE_BYTES { return Err("O arquivo excede o limite de 10 MB.".into()); }
    let object = value.as_object().ok_or("O estado deve ser um objeto JSON.")?;
    if !object.get("settings").map(Value::is_object).unwrap_or(false) { return Err("Configurações ausentes ou inválidas.".into()); }
    for field in ["knowledgeAreas", "subjects", "questionSessions", "lessons", "exams", "essays", "studySessions"] {
        if !object.get(field).map(Value::is_array).unwrap_or(false) { return Err(format!("Lista obrigatória inválida: {field}.")); }
    }
    Ok(())
}

#[tauri::command]
fn read_state(app: AppHandle) -> Result<Value, String> {
    let connection = open_database(&app)?;
    let payload: Option<String> = connection.query_row("SELECT payload FROM study_state WHERE id=1", [], |row| row.get(0)).optional().map_err(|error| error.to_string())?;
    match payload {
        Some(raw) => serde_json::from_str(&raw).map_err(|_| "O banco local contém dados inválidos. Restaure um backup.".into()),
        None => Ok(json!({"settings":{"userName":"Estudante","exam":"ENEM","examTypes":["ENEM"],"cutoff":70,"annualGoal":10000,"studyMinutes":50,"breakMinutes":10,"palette":"graphite","theme":"dark"},"knowledgeAreas":[],"subjects":[],"questionSessions":[],"lessons":[],"exams":[],"essays":[],"studySessions":[],"achievementsUnlocked":[]})),
    }
}

#[tauri::command]
fn write_state(app: AppHandle, payload: Value) -> Result<String, String> {
    validate_state(&payload)?;
    let path = db_path(&app)?;
    if path.exists() { backup_file(&path, "before-write.db")?; }
    let connection = open_database(&app)?;
    let serialized = serde_json::to_string(&payload).map_err(|error| error.to_string())?;
    connection.execute(
        "INSERT INTO study_state(id,payload,updated_at) VALUES(1,?1,?2) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at",
        params![serialized, Utc::now().to_rfc3339()],
    ).map_err(|error| format!("Não foi possível salvar no banco local: {error}"))?;
    Ok("sqlite".into())
}

#[tauri::command]
fn storage_info(app: AppHandle) -> Result<Value, String> {
    Ok(json!({"engine":"SQLite","scope":"device","cloud":false,"path":db_path(&app)?.display().to_string(),"backupDirectory":app_dir(&app)?.join("backups").display().to_string()}))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_state, write_state, storage_info])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar StudyOS");
}
