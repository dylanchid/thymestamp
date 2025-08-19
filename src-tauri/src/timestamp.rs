use chrono::{Datelike, Local, Timelike, Utc, Duration, TimeZone, Offset};
use chrono_tz::Tz;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

#[derive(Serialize, Deserialize, Clone)]
pub struct TimestampFormat {
    pub name: String,
    pub format: String,
    pub value: String,
}

#[tauri::command]
pub fn generate_timestamp(format: String, timezone: Option<String>) -> Result<String, String> {
    // For backward-compat: support simple keywords
    let now = Local::now();
    match format.as_str() {
        "unix" => return Ok(now.timestamp().to_string()),
        "unix_ms" => return Ok(now.timestamp_millis().to_string()),
        "iso" => return Ok(now.to_rfc3339()),
        "rfc2822" => return Ok(now.to_rfc2822()),
        "date" => return Ok(now.format("%Y-%m-%d").to_string()),
        "time" => return Ok(now.format("%H:%M:%S").to_string()),
        "datetime" => return Ok(now.format("%Y-%m-%d %H:%M:%S").to_string()),
        _ => {}
    }

    let tz_opt: Option<Tz> = timezone
        .as_deref()
        .unwrap_or("")
        .parse::<Tz>()
        .ok();
    let formatted = format_with_tokens(&format, tz_opt).unwrap_or_else(|_| "Invalid format".to_string());
    Ok(formatted)
}

#[tauri::command]
pub fn get_current_formats(app: AppHandle) -> Vec<TimestampFormat> {
    let now = Local::now();
    let mut out = vec![
        TimestampFormat {
            name: "Unix Timestamp".to_string(),
            format: "unix".to_string(),
            value: now.timestamp().to_string(),
        },
        TimestampFormat {
            name: "Unix Milliseconds".to_string(),
            format: "unix_ms".to_string(),
            value: now.timestamp_millis().to_string(),
        },
        TimestampFormat {
            name: "ISO 8601".to_string(),
            format: "iso".to_string(),
            value: now.to_rfc3339(),
        },
        TimestampFormat {
            name: "RFC 2822".to_string(),
            format: "rfc2822".to_string(),
            value: now.to_rfc2822(),
        },
        TimestampFormat {
            name: "Date Only".to_string(),
            format: "date".to_string(),
            value: now.format("%Y-%m-%d").to_string(),
        },
        TimestampFormat {
            name: "Time Only".to_string(),
            format: "time".to_string(),
            value: now.format("%H:%M:%S").to_string(),
        },
    ];

    // Load default format and timezone from store if available
    if let Ok(store) = app.store("prefs.json") {
        let default_format = match store.get("defaultFormat") {
            Some(v) => v.as_str().map(|s| s.to_string()),
            _ => None,
        };
        let timezone = match store.get("timezone") {
            Some(v) => v.as_str().map(|s| s.to_string()),
            _ => None,
        };
        if let Some(fmt) = default_format {
            let formatted = format_with_tokens(&fmt, timezone.and_then(|t| t.parse::<Tz>().ok()))
                .unwrap_or_else(|_| "Invalid format".to_string());
            out.insert(0, TimestampFormat { name: "Default Format".into(), format: fmt.clone(), value: formatted });
        }
    }

    out
}

#[tauri::command]
pub fn format_tokens(format: String, timezone: Option<String>) -> Result<String, String> {
    let tz = timezone.and_then(|t| t.parse::<Tz>().ok());
    format_with_tokens(&format, tz)
}

#[tauri::command]
pub fn copy_to_clipboard(
    app: AppHandle,
    text: String,
) -> Result<(), String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    
    app.clipboard()
        .write_text(text)
        .map_err(|e| e.to_string())
}

fn ordinal_suffix(n: u32) -> &'static str {
    if (11..=13).contains(&(n % 100)) {
        "th"
    } else {
        match n % 10 {
            1 => "st",
            2 => "nd",
            3 => "rd",
            _ => "th",
        }
    }
}

fn season(month0: u32) -> &'static str {
    match month0 {
        2..=4 => "Spring",
        5..=7 => "Summer",
        8..=10 => "Fall",
        _ => "Winter",
    }
}

fn week_number(date: chrono::NaiveDate) -> u32 {
    // ISO weeks but non-iso variant can differ; use chrono iso week for both for simplicity
    date.iso_week().week()
}

pub(crate) fn format_with_tokens(fmt: &str, tz: Option<Tz>) -> Result<String, String> {
    // base date now in UTC, then convert
    let now_utc = Utc::now();
    
    // Handle timezone conversion - use dynamic dispatch to work with any timezone
    let (year, month0, day, weekday, hour24, minute, second, millis) = match tz {
        Some(tz) => {
            let dt = tz.from_utc_datetime(&now_utc.naive_utc());
            (dt.year(), dt.month0(), dt.day(), dt.weekday().num_days_from_sunday() as usize,
             dt.hour(), dt.minute(), dt.second(), dt.timestamp_subsec_millis())
        }
        None => {
            let dt = now_utc;
            (dt.year(), dt.month0(), dt.day(), dt.weekday().num_days_from_sunday() as usize,
             dt.hour(), dt.minute(), dt.second(), dt.timestamp_subsec_millis())
        }
    };
    
    let month = month0 + 1;
    
    let days = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    ];
    let days_abb = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];
    let months = [
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
    ];
    let months_abb = [
        "Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec.",
    ];

    let mut hour12 = hour24 as i32;
    let period = if hour12 >= 12 { "PM" } else { "AM" };
    if hour12 > 12 { hour12 -= 12; }
    else if hour12 == 0 { hour12 = 12; }
    let time12 = format!("{}:{:02}", hour12, minute);
    let time24 = format!("{:02}:{:02}", hour24, minute);

    let quarter = ((month - 1) / 3) + 1;
    let season = season(month0);
    
    // Calculate week numbers using a consistent date
    let naive_date = match tz {
        Some(tz) => tz.from_utc_datetime(&now_utc.naive_utc()).date_naive(),
        None => now_utc.date_naive(),
    };
    let week = week_number(naive_date);
    let iso_week = naive_date.iso_week().week();
    let day_ordinal = format!("{}{}", day, ordinal_suffix(day));

    // timezone abbreviation and offset
    let (tz_abbr, tz_full, utc_offset) = if let Some(tz) = tz {
        let offset = tz.offset_from_utc_datetime(&now_utc.naive_utc());
        let total = offset.fix().local_minus_utc(); // seconds
        let sign = if total >= 0 { '+' } else { '-' };
        let total = total.abs();
        let hours = total / 3600;
        let minutes = (total % 3600) / 60;
        let utc_offset = format!("{}{:02}:{:02}", sign, hours, minutes);
        // chrono-tz doesn't expose short names easily; approximate from tz name
        let abbr = tz.name();
        (abbr, tz.name(), utc_offset)
    } else {
        ("UTC", "UTC", "+00:00".to_string())
    };

    // Relative time - for now just use "just now" since we're using current time
    let rel = "just now".to_string();

    let mut out = fmt.to_string();
    // Replace longest tokens first to avoid partial overlaps
    let replacements: &[(&str, String)] = &[
        ("{day-abb}", days_abb[weekday].to_string()),
        ("{month-abb}", months_abb[month0 as usize].to_string()),
        ("{day}", days[weekday].to_string()),
        ("{month}", months[month0 as usize].to_string()),
        ("{date}", format!("{}", day)),
        ("{time}", time12.clone()),
        ("{period}", period.to_string()),
        ("{year}", format!("{}", year)),
        ("{time24}", time24.clone()),
        ("{seconds}", format!("{:02}", second)),
        ("{milliseconds}", format!("{:03}", millis)),
        ("{hours}", format!("{}", hour12)),
        ("{hours24}", format!("{}", hour24)),
        ("{minutes}", format!("{:02}", minute)),
        ("{day-ordinal}", day_ordinal),
        ("{month-num}", format!("{}", month)),
        ("{month-num-pad}", format!("{:02}", month)),
        ("{year-short}", format!("{:02}", year % 100)),
        ("{week}", format!("{}", week)),
        ("{iso-week}", format!("{}", iso_week)),
        ("{quarter}", format!("{}", quarter)),
        ("{season}", season.to_string()),
        ("{timezone}", tz_abbr.to_string()),
        ("{utc-offset}", utc_offset.clone()),
        ("{timezone-full}", tz_full.to_string()),
    ("{relative}", rel),
    ];

    for (k, v) in replacements {
        out = out.replace(k, v);
    }

    Ok(out)
}

fn humanize_duration(d: Duration) -> String {
    let secs = d.num_seconds().abs();
    if secs < 60 { return "just now".into(); }
    let mins = secs / 60;
    if mins < 60 { return format!("{} minute{} ago", mins, if mins==1 {""} else {"s"}); }
    let hours = mins / 60;
    if hours < 24 { return format!("{} hour{} ago", hours, if hours==1 {""} else {"s"}); }
    let days = hours / 24;
    format!("{} day{} ago", days, if days==1 {""} else {"s"})
}
