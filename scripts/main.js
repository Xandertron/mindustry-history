let history = new GridMap()
let limit = 15
let historyplayers = []
let unicode = []

Events.on(ServerLoadEvent, () => {
    Vars.netServer.clientCommands["register(java.lang.String,java.lang.String,java.lang.String,arc.util.CommandHandler$CommandRunner)"](
        "history",
        "[on/off]",
        "Displays the history of blocks",
        (args, player) => {
            let uuid = player.uuid()
            let enabled = historyplayers.includes(uuid)
            if (enabled || args[0] == "off") {
                historyplayers.splice(historyplayers.indexOf(uuid), 1)
                player.sendMessage("[accent]<[#ffff00]⚠[accent]>[#ffffff] Block history has been disabled.")
            }
            // if force on or toggle
            else if (!enabled || args[0] == "on") {
                historyplayers.push(uuid)
                player.sendMessage("[accent]<[#ffff00]⚠[accent]>[#ffffff] Block history has been enabled.")
            }
        }
    )
    Http.get("https://raw.githubusercontent.com/Anuken/Mindustry/master/core/assets/icons/icons.properties").submit(res => {
        let result = res.getResultAsString()
        let icons = result.split("\n")
        icons.forEach(b => {
            if (b == "") { return }
            let n = b.split("=")
            unicode[n[1].split("|")[0]] = n[0]
        })
    })
})
Events.on(TapEvent, event => {
    if (historyplayers.indexOf(event.player.uuid()) >= 0) {
        let bhistory = history.get(event.tile.x, event.tile.y)
        if (bhistory === null) {
            event.player.sendMessage("[accent]<[#ffff00]⚠[accent]>[#ffffff] No history for (" + event.tile.x + ", " + event.tile.y + ")")
        }
        else {
            event.player.sendMessage("History for (" + event.tile.x + ", " + event.tile.y + ")\n" + bhistory.join("\n"))
        }
    }
})
Events.on(EventType.BlockBuildEndEvent, event => {
    let temp = ""
    let name = event.unit == null ? "Deleted Unit" : Strings.stripColors(event.unit.getControllerName() || event.unit.type.name)
    if (event.breaking) {
        temp = "[#ff0000][white] " + name + " [white]broke " + event.tile.build.current + " " + String.fromCharCode(unicode[event.tile.build.current])
    }
    else {
        temp = "[#66ff66][white] " + name + " [white]built " + event.tile.block() + " " + String.fromCharCode(unicode[event.tile.block()])
    }
    pushHistory(event.tile, temp)
})

Events.on(EventType.ConfigEvent, event => {
    let temp = "[#bf92f8][white] "
    let player = {}
    if (event.player == null) {
        player.name = "Server"
    }
    else {
        player.name = event.player.name
    }
    let tile = event.tile.tile
    let subclass
    try {
        subclass = event.tile.block.subclass
    } catch (e) {
        subclass = "none"
    }
    if (subclass === CommandCenter) {
        temp = temp + Strings.stripColors(player.name) + " set this Command Center to " + event.value
    }
    else if (subclass === PowerNode) {
        if (event.player === null) {
            temp = temp + "Server automatically connected nearby unlinked grids"
        }
        else {
            let connected = false
            let link = Point2.unpack(event.value).sub(event.tile.tileX(), event.tile.tileY())
            let ttile = Vars.world.tiles.get(event.tile.tileX() + link.x, event.tile.tileY() + link.y)
            let block = ttile.block()
            event.tile.config().forEach(linked => {
                if ((link.x == linked.x) && (link.y == linked.y)) {
                    temp = temp + Strings.stripColors(player.name) + " [white]linked " + block + " " + String.fromCharCode(unicode[block]) + " (" + ttile.x + ", " + ttile.y + ") to this node"
                    connected = true
                }
            })
            if (!connected) {
                temp = temp + Strings.stripColors(player.name) + " [white]cut " + block + " " + String.fromCharCode(unicode[block]) + " (" + ttile.x + ", " + ttile.y + ") from this node"
            }
        }
    }
    else {
        temp = temp + Strings.stripColors(player.name) + " [white]configured " + tile.block() + " " + String.fromCharCode(unicode[tile.block()])
    }
    pushHistory(tile, temp)
})
function pushHistory(tile, messsage) {
    tile.getLinkedTiles(t => {
        let bhistory = history.get(t.x, t.y)
        if (bhistory === null) {
            bhistory = []
        }
        if (bhistory.length >= limit) {
            bhistory.shift()
        }
        bhistory.push(messsage)
        history.put(t.x, t.y, bhistory)
    })
}
