/**
 * FlowDockTilePlugin — NSDockTilePlugIn implementation
 *
 * The Dock loads this plugin even when Flow isn't running.
 * It reads a shared file to determine which icon to display:
 *   - File missing/empty → default (Liquid Glass from Assets.car)
 *   - File contains absolute path → custom icon
 *
 * Shared file location:
 *   ~/Library/Application Support/Flow/dock-tile-icon-path
 */

#import <Cocoa/Cocoa.h>

@interface FlowDockTilePlugin : NSObject <NSDockTilePlugIn>
@end

@implementation FlowDockTilePlugin

- (void)setDockTile:(NSDockTile *)dockTile {
    if (!dockTile) return;

    // Resolve the shared file path
    NSString *appSupport = [NSSearchPathForDirectoriesInDomains(
        NSApplicationSupportDirectory, NSUserDomainMask, YES) firstObject];
    NSString *sharedFile = [appSupport stringByAppendingPathComponent:@"Flow/dock-tile-icon-path"];

    // Read the icon path from the shared file
    NSString *iconPath = [NSString stringWithContentsOfFile:sharedFile
                                                   encoding:NSUTF8StringEncoding
                                                      error:nil];

    // Trim whitespace/newlines
    iconPath = [iconPath stringByTrimmingCharactersInSet:
        [NSCharacterSet whitespaceAndNewlineCharacterSet]];

    if (!iconPath || iconPath.length == 0) {
        // No custom icon — clear content view so the bundle icon (Liquid Glass) renders
        [dockTile setContentView:nil];
        [dockTile display];
        return;
    }

    // Load the custom icon
    NSImage *image = [[NSImage alloc] initWithContentsOfFile:iconPath];
    if (!image) {
        // Failed to load — fall back to default
        [dockTile setContentView:nil];
        [dockTile display];
        return;
    }

    // Create an image view and set it as the dock tile's content
    NSImageView *imageView = [NSImageView imageViewWithImage:image];
    [dockTile setContentView:imageView];
    [dockTile display];
}

@end
