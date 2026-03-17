# AirBuddy Database Schema

Database: `AB_db`
Server: MySQL 8.0.45

This document describes the database schema used by the **AirBuddy telemetry backend**.
The schema supports device registration, user ownership, home/room organization, and telemetry storage.

---

# Schema Overview

Main conceptual structure:

```
Users
 └─ Homes
     └─ Rooms
         └─ Devices
             └─ Telemetry Readings
```

Supporting tables:

* `device_keys_tb` — device authentication keys
* `sessions` — user session storage
* `buwana_ref_cache_tb` — cached reference metadata

---

# Tables

## buwana_ref_cache_tb

Caches reference data retrieved from the Buwana ecosystem (countries, languages, communities, watersheds). This prevents repeated external API calls.

**Primary Key**

* `(ref_type, ref_id)`

```sql
CREATE TABLE buwana_ref_cache_tb (
  ref_type enum('country','language','community','watershed') NOT NULL,
  ref_id varchar(64) NOT NULL,
  ref_json json NOT NULL,
  etag varchar(128) DEFAULT NULL,
  hash_sha256 char(64) DEFAULT NULL,
  fetched_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at datetime DEFAULT NULL,
  last_seen_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ref_type,ref_id)
);
```

---

# device_keys_tb

Stores hashed authentication keys for devices.

Each device may have multiple keys. Keys can be revoked without deleting the device.

**Relationships**

```
device_keys_tb.device_id → devices_tb.device_id
```

```sql
CREATE TABLE device_keys_tb (
  device_key_id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  device_id int NOT NULL,
  key_hash char(64) NOT NULL,
  label varchar(255),
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at datetime DEFAULT NULL
);
```

---

# devices_tb

Stores registered AirBuddy devices.

Devices can optionally belong to:

* a **home**
* a **room**
* a **claiming user**

**Relationships**

```
devices_tb.home_id → homes_tb.home_id
devices_tb.room_id → rooms_tb.room_id
devices_tb.claimed_by_user_id → users_tb.user_id
```

```sql
CREATE TABLE devices_tb (
  device_id int AUTO_INCREMENT PRIMARY KEY,
  device_uid varchar(64) NOT NULL,
  home_id int DEFAULT NULL,
  room_id int DEFAULT NULL,
  claimed_by_user_id bigint unsigned DEFAULT NULL,
  device_name varchar(255),
  device_type varchar(64) NOT NULL DEFAULT 'pico_w',
  firmware_version varchar(64),
  status enum('active','disabled','retired') DEFAULT 'active',
  last_seen_at datetime DEFAULT NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_devices_uid (device_uid)
);
```

---

# homes_tb

Represents a physical location belonging to a user.

A home may contain multiple rooms and devices.

**Relationships**

```
homes_tb.owner_user_id → users_tb.user_id
```

```sql
CREATE TABLE homes_tb (
  home_id int AUTO_INCREMENT PRIMARY KEY,
  owner_user_id bigint unsigned NOT NULL,
  home_name varchar(255) NOT NULL,
  time_zone varchar(50),
  privacy_level enum('private','shared_link','community','public')
       NOT NULL DEFAULT 'private',
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

# home_memberships_tb

Allows multiple users to belong to a home with different roles.

Roles:

* owner
* admin
* member
* viewer

**Relationships**

```
home_memberships_tb.home_id → homes_tb.home_id
home_memberships_tb.user_id → users_tb.user_id
```

```sql
CREATE TABLE home_memberships_tb (
  home_id int NOT NULL,
  user_id bigint unsigned NOT NULL,
  role enum('owner','admin','member','viewer') DEFAULT 'member',
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (home_id,user_id)
);
```

---

# rooms_tb

Rooms belong to a home and contain devices.

Unique constraint prevents duplicate room names within the same home.

**Relationships**

```
rooms_tb.home_id → homes_tb.home_id
```

```sql
CREATE TABLE rooms_tb (
  room_id int AUTO_INCREMENT PRIMARY KEY,
  home_id int NOT NULL,
  room_name varchar(255) NOT NULL,
  floor varchar(64),
  notes text,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_rooms_home_name (home_id,room_name)
);
```

---

# telemetry_readings_tb

Stores telemetry data sent by AirBuddy devices.

Telemetry includes:

* timestamp
* optional GPS coordinates
* sensor values stored in JSON

**Relationships**

```
telemetry_readings_tb.device_id → devices_tb.device_id
```

```sql
CREATE TABLE telemetry_readings_tb (
  telemetry_id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  device_id int NOT NULL,
  recorded_at datetime NOT NULL,
  received_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lat decimal(10,8),
  lon decimal(11,8),
  alt_m decimal(8,2),
  values_json json NOT NULL,
  confidence_json json,
  flags_json json,
  UNIQUE KEY uniq_device_recorded (device_id,recorded_at)
);
```

---

# sessions

Session storage used for authenticated dashboard access.

```sql
CREATE TABLE sessions (
  session_id varchar(128) PRIMARY KEY,
  expires int unsigned NOT NULL,
  data mediumtext
);
```

---

# users_tb

Stores AirBuddy users synchronized with Buwana identity.

Key identifiers:

* `buwana_sub` (OpenID subject)
* `buwana_id`
* `email`

This table also stores profile and location metadata.

```sql
CREATE TABLE users_tb (
  user_id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  buwana_sub varchar(255) NOT NULL,
  buwana_id int,
  username varchar(255),
  first_name varchar(255) NOT NULL,
  last_name varchar(255),
  full_name varchar(255) NOT NULL,
  email varchar(100),
  account_status varchar(100),
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  role varchar(255) NOT NULL DEFAULT 'user',
  gea_status varchar(255) NOT NULL DEFAULT 'null',
  terms_of_service tinyint(1) NOT NULL DEFAULT 0,
  flagged tinyint(1) NOT NULL DEFAULT 0,
  suspended tinyint(1) NOT NULL DEFAULT 0,
  profile_pic varchar(255) DEFAULT 'null'
);
```

---

# Key Data Relationships

```
users_tb
   │
   ├── homes_tb
   │       │
   │       └── rooms_tb
   │              │
   │              └── devices_tb
   │                      │
   │                      └── telemetry_readings_tb
   │
   └── home_memberships_tb
```

---

# Authentication Model

Devices authenticate with:

```
X-Device-Id
X-Device-Key
```

The key hash is stored in:

```
device_keys_tb
```

---

# Telemetry Flow

```
AirBuddy Device
        │
        ▼
POST /api/v1/telemetry
        │
        ▼
devices_tb lookup
        │
        ▼
telemetry_readings_tb insert
```

---

# Notes for Developers

Recommended indexes already included:

* device lookup
* home membership lookup
* telemetry time queries

Future improvements may include:

* telemetry partitioning by date
* device firmware tracking
* anomaly detection flags
* telemetry summary tables
